# Security Specification for FiguSwap Argentina

## 1. Data Invariants
- **Profile Invariant:** A user can only write, update, or self-assign attributes to their own user document (`/users/{uid}`). A user must not be able to modify high-integrity system fields such as `verified`, `reputation`, or change `uid`, `email` once registered.
- **Verification Guarantee:** Writes to the user's document must enforce email verification: `request.auth.token.email_verified == true`.
- **Sticker Status Integrity:** A user may update their own sticker inventory states, but cannot modify another user's sticker inventory.
- **Review Integrity:** Users can read other users' reviews to verify their trade trust history, but only authenticated users can write reviews under strict schema invariants.
- **Conversation Authorization (Zero-Trust):** Only marked participants of a chat room (declared in static `participants` fields) can fetch room data or send messages.
- **Phishing Prevention Filter:** Chat messages must go through server-side AI evaluation to filter phishing attempts before write validation.
- **Atomic Matches Constraint:** Matches can only be seen and swiped by the two users belonging to that specific match, strictly verifying their UIDs.

---

## 2. The "Dirty Dozen" Security Violations (Scenarios)

1. **Self-Reputation Boost:** User `u1` attempts to maliciously increment their own `reputation` to `5.0`.
2. **Self-Verification Privilege Escalation:** User `u1` attempts to modify their profile `verified` property to `true`.
3. **Identity Spoofing Write (Profile Hijacking):** User `u1` attempts to overwrite user `u2`'s profile metadata.
4. **Unverified Auth Access:** User with unverified email (`email_verified == false`) attempts to register/create a profile.
5. **Ghost Field Poisoning:** User attempts to update metadata with unsupported extra parameters (`shadow_tokens: "unlimited_swipes"`).
6. **Malicious ID Character Injection (Poisoning):** User attempts to target a document with a junk ID path, e.g. `/users/SOME%$#@1MBcharsJUNK`.
7. **Cross-User Sticker Manipulation:** User `u1` tries to change user `u2`'s sticker collection to delete their Messi card.
8. **Eavesdropping on Private Conversations:** User `u3` attempts to fetch chat messages of a conversation room belonging exclusively to `u1` and `u2`.
9. **Message Author Impersonation:** User `u2` attempts to write a message in a room setting the `senderId` as `u1`.
10. **Match Hijacking Swipes:** User `u3` attempts to approve/complete a Match record on behalf of `u1` and `u2`.
11. **Negative Reviews Under False Names:** User attempts to submit a review without aligning the `reviewerName` with their authenticated profile or under someone else's `uid`.
12. **Blanket Query Scraping:** A client attempts to request a blanket `list` of all user profiles with PII without proving authentic matching queries.

---

## 3. Test Runner Specification (`firestore.rules.test.ts`)

Here is the test suite verifying that all these attempts are securely rejected (`PERMISSION_DENIED`).

```typescript
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment, 
  assertFails, 
  assertSucceeds 
} from "@firebase/rules-unit-testing";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

describe("FiguSwap Comprehensive Security Test Suite", () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "gen-lang-client-0069814546",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8")
      }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Scenario 1: Self-Reputation Boost
  it("denies self-reputation updates from user", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: true });
    const userRef = context.firestore().doc("users/u1");
    // Pre-create
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("users/u1").set({
        uid: "u1",
        displayName: "Marcos",
        email: "marcos@gmail.com",
        reputation: 4.0,
        verified: false,
        city: "CABA",
        neighborhood: "Almagro"
      });
    });

    await assertFails(userRef.update({ reputation: 5.0 }));
  });

  // Scenario 2: Self-Verification
  it("denies user setting their own verified badge to true", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: true });
    const userRef = context.firestore().doc("users/u1");
    await assertFails(userRef.update({ verified: true }));
  });

  // Scenario 3: Identity Spoofing (Write other profile)
  it("denies user u1 from updating profile of user u2", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: true });
    const otherRef = context.firestore().doc("users/u2");
    await assertFails(otherRef.set({
      uid: "u2",
      displayName: "Carlos Hacker",
      email: "carlos@gmail.com",
      city: "CABA",
      verified: false
    }));
  });

  // Scenario 4: Unverified email registration
  it("denies user profile write if their email is not verified", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: false });
    const userRef = context.firestore().doc("users/u1");
    await assertFails(userRef.set({
      uid: "u1",
      displayName: "Marcos No-Veri",
      email: "marcos@gmail.com",
      city: "CABA",
      verified: false
    }));
  });

  // Scenario 5: Ghost Field Poisoning
  it("denies registration payload with un-whitelisted properties", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: true });
    const userRef = context.firestore().doc("users/u1");
    await assertFails(userRef.set({
      uid: "u1",
      displayName: "Marcos",
      email: "marcos@gmail.com",
      city: "CABA",
      neighborhood: "Almagro",
      reputation: 5.0,
      verified: false,
      shadow_tokens: "unlimited" // invalid key
    }));
  });

  // Scenario 6: Malicious ID character poisoning
  it("denies accessing paths with junk character formats", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: true });
    const badRef = context.firestore().doc("users/SOME_TRASH_$%_#@");
    await assertFails(badRef.get());
  });

  // Scenario 7: Cross-User Sticker Manipulation
  it("denies user u1 from modifying user u2's stickers", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: true });
    const stickerRef = context.firestore().doc("users/u2/stickers/ARG-10");
    await assertFails(stickerRef.set({ status: "tengo" }));
  });

  // Scenario 8: Chat Eavesdropping
  it("denies user u3 from reading a private chat between u1 and u2", async () => {
    // Setup pre-created chat
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("chats/chat_u1_u2").set({
        id: "chat_u1_u2",
        matchId: "some-match",
        participants: ["u1", "u2"],
        lastUpdated: new Date().toISOString()
      });
    });

    const context = testEnv.authenticatedContext("u3", { email_verified: true });
    const chatRef = context.firestore().doc("chats/chat_u1_u2");
    await assertFails(chatRef.get());
  });

  // Scenario 9: Msg Author Impersonation
  it("denies user u2 from sending a message labeled as sender u1", async () => {
    const context = testEnv.authenticatedContext("u2", { email_verified: true });
    const msgRef = context.firestore().doc("chats/chat_u1_u2/messages/msg-123");
    await assertFails(msgRef.set({
      id: "msg-123",
      senderId: "u1", // impersonating u1
      text: "Hola Carlos",
      timestamp: new Date().toISOString()
    }));
  });

  // Scenario 10: Match Hijacking Swipes
  it("denies third party user u3 from swiping/updating a match belonging to u1 and u2", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("matches/match_u1_u2").set({
        id: "match_u1_u2",
        uids: ["u1", "u2"],
        compatibilityScore: 90,
        status: "pending"
      });
    });

    const context = testEnv.authenticatedContext("u3", { email_verified: true });
    const matchRef = context.firestore().doc("matches/match_u1_u2");
    await assertFails(matchRef.update({ status: "matched" }));
  });

  // Scenario 11: Negative review identity misalignment
  it("denies review posting if user identity details do not match", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: true });
    const reviewRef = context.firestore().doc("users/u2/reviews/rev-999");
    await assertFails(reviewRef.set({
      id: "rev-999",
      reviewerName: "Imposter Carlos", // mismatch with marcos
      rating: 1,
      comment: "Liar",
      date: new Date().toISOString()
    }));
  });

  // Scenario 12: Blanket Security List Protection
  it("denies un-targeted blanket queries or scraping on chat rooms", async () => {
    const context = testEnv.authenticatedContext("u1", { email_verified: true });
    const chatsCollection = context.firestore().collection("chats");
    // Listing query must be denied unless it precisely filters for participants
    await assertFails(chatsCollection.get());
  });
});
```
