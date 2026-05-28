import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import InventoryView from './components/InventoryView';
import MatchEngine from './components/MatchEngine';
import SafeZonesMap from './components/SafeZonesMap';
import ChatRoomView from './components/ChatRoomView';
import { MOCK_COLLECTORS } from './data';
import { UserProfile, StickerStatus, SwapMatch, ChatRoom, ChatMessage, CityLocation, Sticker } from './types';
import { Shield, Sparkles, MessageSquare, Award, Star, RefreshCw, Key, LogOut } from 'lucide-react';
import { 
  auth, 
  db, 
  signInWithPopup, 
  googleProvider, 
  signOut, 
  onAuthStateChanged,
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,

  collection, 
  query, 
  where, 
  onSnapshot,
  User
} from './firebase';
import { signInAnonymously } from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [stickerStates, setStickerStates] = useState<Record<string, StickerStatus>>({});
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [activeMatches, setActiveMatches] = useState<SwapMatch[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [openedRoomId, setOpenedRoomId] = useState<string | null>(null);

  // Seeding helper to pre-fill active profiles, sticker vectors & chat history instantly
  const seedUserCollections = async (uid: string, email: string, displayName: string, photoURL?: string | null) => {
    // 1. Seed user profile
    const userProfile: UserProfile = {
      uid,
      displayName: displayName || 'Marcos Bernal (Tú)',
      email: email || 'M.Bernal8036@gmail.com',
      city: 'CABA',
      neighborhood: 'Caballito',
      reputation: 5.0,
      verified: false,
      bio: 'Buscando completar a la Scaloneta de oro. Cambio solo en Parque Central o Rivadavia.',
      reviewsCount: 8,
      reviews: [
        { id: 'r-user-1', reviewerName: 'Carlos Gómez', rating: 5, comment: 'Excelente canje, completó rápido su parte.', date: '2026-05-24' }
      ],
      stickerCounts: { tengo: 642, falta: 300, repetida: 52 },
      photoURL: photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
    };
    try {
      await setDoc(doc(db, 'users', uid), userProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
    }

    // 2. Seed initial stickers list
    const initialStickers = {
      'ARG-1': 'tengo', 'ARG-2': 'tengo', 'ARG-3': 'tengo', 'ARG-4': 'tengo', 'ARG-5': 'tengo',
      'ARG-10': 'falta', 'CC-10': 'falta', 'GER-10': 'falta', 'FRA-10': 'falta',
      'GER-17': 'repetida', 'ESP-17': 'repetida', 'CC-1': 'repetida', 'URU-15': 'repetida'
    };
    for (const [sid, stat] of Object.entries(initialStickers)) {
      try {
        await setDoc(doc(db, 'users', uid, 'stickers', sid), { status: stat });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${uid}/stickers/${sid}`);
      }
    }

    // 3. Seed other collectors profiles in the database so lookup queries match successfully
    for (const col of MOCK_COLLECTORS) {
      try {
        await setDoc(doc(db, 'users', col.uid), col);
      } catch (err) {
        // Suppress warning/error because only the owner is authorized to create/write user profiles!
        console.warn(`Could not seed other collector's profile (uid: ${col.uid}). Skipping as expected by security rules.`);
      }
    }

    // 4. Seed preloaded Match recommendation
    const preloadedMatch: any = {
      id: `match-preload-${uid}`,
      status: 'matched',
      compatibilityScore: 92,
      uids: [uid, 'u2'],
      stickersIProvide: ['ESP-17', 'CC-1'],
      stickersTheyProvide: ['ARG-10', 'CC-10']
    };
    try {
      await setDoc(doc(db, 'matches', `match-preload-${uid}`), preloadedMatch);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `matches/match-preload-${uid}`);
    }

    // 5. Seed preloaded Chat Room
    const preloadedRoom: any = {
      id: `room-preload-${uid}`,
      matchId: `match-preload-${uid}`,
      participants: [uid, 'u2'],
      lastUpdated: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'chats', `room-preload-${uid}`), preloadedRoom);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/room-preload-${uid}`);
    }

    // 6. Seed messages subcollection
    const messages = [
      { id: 'm-init-1', senderId: 'u2', text: '¡Hola Marcos! Vi que tenés a Lamine Yamal repetida (ESP-17). Justo la necesito para completar el plantel de España.', timestamp: '2026-05-25T14:30:00Z' },
      { id: 'm-init-2', senderId: uid, text: '¡Buenas Carlos! Sí, la tengo repetida por triplicado. Vi que tenés a Messi (ARG-10) duplicada, ¿te parece si hacemos mano a mano en Parque Centenario?', timestamp: '2026-05-25T14:34:00Z' },
      { id: 'm-init-3', senderId: 'u2', text: 'Dale, de una! Nos juntamos mañana tipo 17hs cerca de la fuente de agua. Te llevo también la especial de Coca-Cola que te falta de regalo.', timestamp: '2026-05-25T14:35:00Z' }
    ];
    for (const m of messages) {
      try {
        await setDoc(doc(db, 'chats', `room-preload-${uid}`, 'messages', m.id), m);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `chats/room-preload-${uid}/messages/${m.id}`);
      }
    }
  };

  // Auth Status listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setAuthLoading(true);
      if (user) {
        // Authenticated! Find matching User Profile document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            setCurrentUser(userSnap.data() as UserProfile);
          } else {
            // New user registration - seed default profile
            await seedUserCollections(user.uid, user.email || 'M.Bernal8036@gmail.com', user.displayName || 'Marcos Bernal (Tú)', user.photoURL);
            const newSnap = await getDoc(userDocRef);
            setCurrentUser(newSnap.data() as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen to User Profile updates in real time
  useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentUser(snapshot.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
    });
    return unsub;
  }, [isAuthenticated]);

  // Read personal Album stickers inventory in real time
  useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) return;
    const unsub = onSnapshot(collection(db, 'users', auth.currentUser.uid, 'stickers'), (snapshot) => {
      const states: Record<string, StickerStatus> = {};
      snapshot.forEach((document) => {
        states[document.id] = (document.data() as any).status;
      });
      setStickerStates(states);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/stickers`);
    });
    return unsub;
  }, [isAuthenticated]);

  // Read persistent swipes / Active matches in real-time
  useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) return;
    const q = query(
      collection(db, 'matches'),
      where('uids', 'array-contains', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const matches: SwapMatch[] = [];
      snapshot.forEach((document) => {
        const data = document.data() as any;
        // In this architecture, otherUser profile details will be retrieved from pre-baked set
        const companionUid = data.uids.find((uid: string) => uid !== auth.currentUser?.uid);
        const otherUser = MOCK_COLLECTORS.find(c => c.uid === companionUid) || MOCK_COLLECTORS[0];
        matches.push({
          id: document.id,
          otherUser,
          compatibilityScore: data.compatibilityScore,
          stickersIProvide: data.stickersIProvide,
          stickersTheyProvide: data.stickersTheyProvide,
          status: data.status
        });
      });
      setActiveMatches(matches.filter(m => m.status === 'matched'));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'matches');
    });
    return unsub;
  }, [isAuthenticated]);

  // Read active chat sessions thread updates in real-time
  useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      try {
        const rooms: ChatRoom[] = [];
        for (const document of snapshot.docs) {
          const data = document.data() as any;
          const companionUid = data.participants.find((uid: string) => uid !== auth.currentUser?.uid);
          const otherUser = MOCK_COLLECTORS.find(c => c.uid === companionUid) || MOCK_COLLECTORS[0];
          
          // Load messages subcollection (limit to recent for fast UI)
          const messagesSnap = await getDocs(collection(db, 'chats', document.id, 'messages')).catch(err => {
            handleFirestoreError(err, OperationType.LIST, `chats/${document.id}/messages`);
            throw err;
          });
          const messagesList: ChatMessage[] = [];
          messagesSnap.forEach((mDoc) => {
            messagesList.push(mDoc.data() as ChatMessage);
          });

          // sort messages by timestamp
          messagesList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          rooms.push({
            id: document.id,
            matchId: data.matchId,
            otherUser,
            messages: messagesList,
            lastUpdated: data.lastUpdated
          });
        }
        setChatRooms(rooms);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'chats');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });
    return unsub;
  }, [isAuthenticated]);

  // Core Authentication flows
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Popup identity failed. Triggering demo fallback.");
      // Fallback in case of strict iframe popup blocking policies
      await handleFastPassSignIn();
    }
  };

  const handleFastPassSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    setOpenedRoomId(null);
    await signOut(auth);
  };

  // Update a single Sticker Status on the user inventory
  const handleUpdateStickerStatus = async (stickerId: string, status: StickerStatus) => {
    if (!isAuthenticated || !auth.currentUser) return;
    const stickerRef = doc(db, 'users', auth.currentUser.uid, 'stickers', stickerId);
    try {
      await setDoc(stickerRef, { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/stickers/${stickerId}`);
    }

    // Recalculate tally metrics
    const updated = { ...stickerStates, [stickerId]: status };
    const counts = { tengo: 0, falta: 0, repetida: 0 };
    Object.keys(updated).forEach(id => {
      const s = updated[id];
      if (s === 'tengo') counts.tengo++;
      else if (s === 'falta') counts.falta++;
      else if (s === 'repetida') counts.repetida++;
    });

    const newTengo = 600 + counts.tengo;
    const newFalta = 394 - counts.tengo + counts.falta;
    const newRepetida = counts.repetida;

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'stickerCounts.tengo': newTengo,
        'stickerCounts.falta': newFalta,
        'stickerCounts.repetida': newRepetida
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  // Scanner bulk addition
  const handleBulkAddDuplicates = async (stickers: Sticker[]) => {
    if (!isAuthenticated || !auth.currentUser) return;
    for (const sticker of stickers) {
      const stickerRef = doc(db, 'users', auth.currentUser.uid, 'stickers', sticker.id);
      try {
        await setDoc(stickerRef, { status: 'repetida' });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/stickers/${sticker.id}`);
      }
    }
    setActiveTab('inventory');
  };

  // Checklist handwritten sheet bulk integration
  const handleBulkApplyChecklist = async (updates: { id: string; status: StickerStatus }[]) => {
    if (!isAuthenticated || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const batchUpdates: Record<string, StickerStatus> = { ...stickerStates };

    for (const update of updates) {
      const stickerRef = doc(db, 'users', uid, 'stickers', update.id);
      try {
        await setDoc(stickerRef, { status: update.status });
        batchUpdates[update.id] = update.status;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/stickers/${update.id}`);
      }
    }

    // Recalculate collection counts for profile dashboard
    const counts = { tengo: 0, falta: 0, repetida: 0 };
    Object.keys(batchUpdates).forEach(id => {
      const s = batchUpdates[id];
      if (s === 'tengo') counts.tengo++;
      else if (s === 'falta') counts.falta++;
      else if (s === 'repetida') counts.repetida++;
    });

    const newTengo = 600 + counts.tengo;
    const newFalta = 394 - counts.tengo + counts.falta;
    const newRepetida = counts.repetida;

    try {
      await updateDoc(doc(db, 'users', uid), {
        'stickerCounts.tengo': newTengo,
        'stickerCounts.falta': newFalta,
        'stickerCounts.repetida': newRepetida
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Unlock Chatroom from swiper match card
  const handleUnlockChat = async (otherUser: UserProfile, match: SwapMatch) => {
    if (!isAuthenticated || !auth.currentUser) return;
    const roomId = `room-${otherUser.uid}-${auth.currentUser.uid}`;
    const roomRef = doc(db, 'chats', roomId);
    try {
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        await setDoc(roomRef, {
          id: roomId,
          matchId: match.id,
          participants: [auth.currentUser.uid, otherUser.uid],
          lastUpdated: new Date().toISOString()
        });

        // Write welcome message
        const msgId = `welcome-${Date.now()}`;
        await setDoc(doc(db, 'chats', roomId, 'messages', msgId), {
          id: msgId,
          senderId: otherUser.uid,
          text: `¡Hola! Acabamos de hacer match para intercambiar. Tengo ${match.stickersTheyProvide.length} que necesitas. ¿Nos coordinamos para canjear en un punto seguro?`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${roomId}`);
    }

    setOpenedRoomId(roomId);
    setActiveTab('chats');
  };

  // Send a message thread item
  const handleSendMessage = async (roomId: string, newMsg: ChatMessage) => {
    if (!isAuthenticated || !auth.currentUser) return;
    const roomRef = doc(db, 'chats', roomId);
    
    try {
      // 1. Write the message to our live subcollection
      await setDoc(doc(db, 'chats', roomId, 'messages', newMsg.id), newMsg);
      // 2. Update parent rooms tracker timestamp
      await updateDoc(roomRef, { lastUpdated: newMsg.timestamp });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${roomId}/messages/${newMsg.id}`);
    }

    // 3. Trigger mock local replies inside chat for realism
    setTimeout(async () => {
      const room = chatRooms.find(r => r.id === roomId);
      if (room && newMsg.senderId === auth.currentUser?.uid) {
        const lowerText = newMsg.text.toLowerCase();
        let replyText = '¡Dale excelente! Sigamos coordinando.';
        
        if (lowerText.includes('hola') || lowerText.includes('buenas')) {
          replyText = `¡Qué hacés crack! ¿Cómo va? Listísimo para cambiar las figuritas.`;
        } else if (lowerText.includes('donde') || lowerText.includes('dónde') || lowerText.includes('parque') || lowerText.includes('cafeta')) {
          replyText = `Me queda bárbaro el Parque Centenario cerca de Caballito para encontrarnos. ¿Qué te parece?`;
        } else if (lowerText.includes('hora') || lowerText.includes('cuando') || lowerText.includes('mañana')) {
          replyText = `Mañana por la tarde puedo de una, tipo 17 o 18hs te parece bien?`;
        } else {
          replyText = `Copiado. Recordá que podemos validar las figuritas directamente con el validador por código QR cuando nos veamos en persona y así registrar el trueque.`;
        }

        const replyMsgId = `reply-${Date.now()}`;
        try {
          await setDoc(doc(db, 'chats', roomId, 'messages', replyMsgId), {
            id: replyMsgId,
            senderId: room.otherUser.uid,
            text: replyText,
            timestamp: new Date().toISOString()
          });
          await updateDoc(roomRef, { lastUpdated: new Date().toISOString() });
        } catch (err) {
          console.warn("Could not write simulated reply message inside database room:", err);
        }
      }
    }, 2500);
  };

  // Finalize Trades via Physical QR Validation Code
  const handleCompleteSwap = async (otherUid: string, giveStickers: string[], takeStickers: string[]) => {
    if (!isAuthenticated || !auth.currentUser) return;
    
    // Give owned but no longer repeated
    for (const id of giveStickers) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'stickers', id), { status: 'tengo' });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/stickers/${id}`);
      }
    }
    // Take needed (now owned)
    for (const id of takeStickers) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'stickers', id), { status: 'tengo' });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/stickers/${id}`);
      }
    }
  };

  // Submit trade reviews of reputation stars
  const handleAddReviewToUser = async (otherUid: string, rating: number, comment: string) => {
    if (!isAuthenticated || !auth.currentUser) return;
    const reviewId = `rev-${Date.now()}`;
    try {
      await setDoc(doc(db, 'users', otherUid, 'reviews', reviewId), {
        id: reviewId,
        reviewerName: currentUser?.displayName || 'Marcos Bernal',
        rating,
        comment,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${otherUid}/reviews/${reviewId}`);
    }

    // Update stats on other user
    const otherRef = doc(db, 'users', otherUid);
    try {
      const otherSnap = await getDoc(otherRef);
      if (otherSnap.exists()) {
        const data = otherSnap.data() as UserProfile;
        const newCount = data.reviewsCount + 1;
        const newRep = (data.reputation * data.reviewsCount + rating) / newCount;
        await updateDoc(otherRef, {
          reputation: newRep,
          reviewsCount: newCount
        });
      }
    } catch (err) {
      // Direct write of companion's fields is restricted under security rules uids logic!
      // This is expected and we swallow the warning to guarantee reviews can still be posted
      console.warn(`Direct updating counterpart profile fields (uid: ${otherUid}) is blocked, swallowed as expected.`);
    }
  };

  // Profile fields changes
  const handleChangeUserCity = async (city: CityLocation) => {
    if (!isAuthenticated || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { city });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const handleUpdateBio = async (bio: string) => {
    if (!isAuthenticated || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { bio });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const handleUpdateName = async (displayName: string) => {
    if (!isAuthenticated || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const handleTogglePrivateMode = async (enabled: boolean) => {
    if (!isAuthenticated || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { privateMode: enabled });
      if (enabled) {
        setActiveTab('inventory');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 text-emerald-400 animate-spin" />
        <p className="text-xs text-neutral-400 font-bold font-mono tracking-wide">Cargando base de datos persistente...</p>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    // Elegant Authentication Lobby Gate View
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-6 antialiased" id="login-auth-lobby">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-7 shadow-2xl relative overflow-hidden">
          {/* Subtle decoration sphere */}
          <div className="absolute -top-10 -right-10 h-36 w-36 bg-emerald-550/10 rounded-full blur-3xl animate-pulse" />

          {/* Logo Brand Header */}
          <div className="text-center space-y-2.5 relative">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-2xl inline-block shadow-md">
              <Sparkles className="h-8 w-8 animate-bounce" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-100 flex items-center justify-center gap-1">
                <span>FiguSwap</span>
                <span className="text-emerald-400 text-xs py-0.5 px-2 bg-emerald-500/15 border border-emerald-400/20 rounded-full font-mono font-bold tracking-widest leading-none">AR</span>
              </h1>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-widest font-mono uppercase">Intercambio de figuritas del Mundial</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-neutral-300 leading-relaxed text-center">
              Registra tu álbum, detecta sinergias instantáneas con coleccionistas en tu ciudad y acuerda trueques guiados en zonas seguras.
            </p>

            {/* Stats board */}
            <div className="grid grid-cols-2 gap-3.5 bg-neutral-950 p-4 rounded-2xl border border-neutral-850 text-center text-xs font-bold">
              <div className="space-y-0.5">
                <span className="text-emerald-400 text-sm block">994</span>
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Figus Habilitadas</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-emerald-400 text-sm block">100%</span>
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Zonas Municipales</span>
              </div>
            </div>
          </div>

          {/* Login Actions */}
          <div className="space-y-2.5 pt-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-emerald-500 hover:bg-emerald-650 active:scale-[0.98] text-neutral-950 font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Key className="h-4.5 w-4.5" />
              <span>Ingresar con Google Account</span>
            </button>

            <button
              onClick={handleFastPassSignIn}
              className="w-full bg-neutral-950 hover:bg-neutral-800 active:scale-[0.98] text-neutral-300 font-semibold border border-neutral-800 text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Ingreso Rápido (Evaluar Aplicación)</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-[9px] text-neutral-550 flex items-center justify-center gap-1 uppercase tracking-widest">
              <Shield className="h-3 w-3" /> Base de Datos y Auth Sincronizados
            </span>
          </div>
        </div>
      </div>
    );
  }

  const openedRoom = chatRooms.find(r => r.id === openedRoomId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased font-sans" id="application-body-wrapper">
      {/* Top Banner Branding Header */}
      <header className="sticky top-0 bg-neutral-900/90 border-b border-neutral-800/80 backdrop-blur-md z-40 max-w-md mx-auto sm:max-w-xl md:max-w-2xl w-full px-4 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 bg-emerald-500 rounded-lg text-neutral-900 font-black tracking-tighter text-sm flex items-center gap-0.5 shadow-md">
            <span>F</span><span className="text-neutral-900 text-xs">S</span>
          </div>
          <div>
            <span className="text-xs font-black tracking-tight text-neutral-100 uppercase block">FiguSwap</span>
            <span className="text-[9px] text-emerald-400 tracking-wider font-mono uppercase block">Argentina 🇦🇷</span>
          </div>
        </div>

        {/* User Auth display states & logout action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-neutral-800 px-2.5 py-1 rounded-full text-[9px] font-bold text-neutral-300 bg-neutral-950/40">
            <img src={currentUser.photoURL} alt="Yo" className="h-3.5 w-3.5 rounded-full object-cover" />
            <span className="hidden sm:inline">{currentUser.displayName.split(' ')[0]}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-1.5 hover:bg-neutral-850 border border-neutral-800 text-rose-450 hover:text-rose-350 rounded-xl transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Core Router Panels */}
      <main className="flex-1 max-w-md mx-auto sm:max-w-xl md:max-w-2xl w-full px-4 pt-3 pb-24 overflow-y-auto overflow-x-hidden">
        {openedRoomId && activeTab === 'chats' && openedRoom ? (
          <ChatRoomView
            room={openedRoom}
            currentUser={currentUser}
            stickerStates={stickerStates}
            onBack={() => setOpenedRoomId(null)}
            onSendMessage={handleSendMessage}
            onCompleteSwap={handleCompleteSwap}
            onAddReviewToUser={handleAddReviewToUser}
          />
        ) : (
          <div className="animate-fade-in space-y-4">
            {activeTab === 'inventory' && (
              <InventoryView
                stickerStates={stickerStates}
                onUpdateStickerStatus={handleUpdateStickerStatus}
                onBulkAddDuplicates={handleBulkAddDuplicates}
                onBulkApplyChecklist={handleBulkApplyChecklist}
                privateMode={currentUser.privateMode}
              />
            )}

            {activeTab === 'swap' && (
              <MatchEngine
                currentUser={currentUser}
                stickerStates={stickerStates}
                onUnlockChat={handleUnlockChat}
                activeMatches={activeMatches}
                setActiveMatches={setActiveMatches}
              />
            )}

            {activeTab === 'safezones' && <SafeZonesMap />}

            {activeTab === 'chats' && (
              <div className="space-y-3" id="chats-conversations-list">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-550 uppercase tracking-widest block">Mis Conversaciones de Trueque</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    {chatRooms.length} activos
                  </span>
                </div>

                <p className="text-[10px] text-neutral-400 leading-relaxed bg-neutral-900 border border-neutral-800 p-3 rounded-xl italic">
                  Abajo verás los chats con coleccionistas cercanos con quienes hiciste match. Acuerden el canje con confianza y usen el validador QR una vez reunidos físicamente en el Parque o local habilitado.
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {chatRooms.length > 0 ? (
                    chatRooms.map((room) => {
                      const lastMessage = room.messages[room.messages.length - 1];
                      return (
                        <div
                          key={room.id}
                          onClick={() => setOpenedRoomId(room.id)}
                          className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/30 hover:bg-neutral-850 p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-sm"
                          id={`chat-room-card-${room.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative">
                              <img
                                src={room.otherUser.photoURL}
                                alt={room.otherUser.displayName}
                                className="h-11 w-11 rounded-full border border-neutral-700 object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-405 rounded-full border-2 border-neutral-900" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-neutral-100 truncate">{room.otherUser.displayName}</span>
                                <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5">★ {room.otherUser.reputation.toFixed(1)}</span>
                              </div>
                              <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                                {lastMessage ? lastMessage.text : 'Trueque habilitado'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span className="text-[8px] text-neutral-500 block uppercase font-medium">
                              {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <span className="inline-block mt-1 text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400">
                              Trueque Activo
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-8 text-center space-y-2">
                      <MessageSquare className="h-8 w-8 text-neutral-600 block mx-auto" />
                      <p className="text-xs text-neutral-400">Aún no tienes chats desbloqueados.</p>
                      <p className="text-[10px] text-neutral-500">Comienza a swipear candidatos compatibles en "Matcher" para concretar trueques.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <InventoryViewPropsWrapper
                currentUser={currentUser}
                handleChangeUserCity={handleChangeUserCity}
                handleUpdateBio={handleUpdateBio}
                handleUpdateName={handleUpdateName}
                handleTogglePrivateMode={handleTogglePrivateMode}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Global Router Navbar layout */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'chats') {
            setOpenedRoomId(null);
          }
        }}
        unreadCount={currentUser.privateMode ? 0 : (openedRoomId ? 0 : 2)}
        matchCount={currentUser.privateMode ? 0 : deckHasCompatiblesCount(currentUser.city, activeMatches)}
        privateMode={currentUser.privateMode}
      />
    </div>
  );
}

// Low level helpers to compute numbers of swipe candidates nearby
function deckHasCompatiblesCount(city: string, active: SwapMatch[]): number {
  const matchingLen = MOCK_COLLECTORS.filter(c => c.city === city).length;
  const activeLen = active.filter(m => m.otherUser.city === city).length;
  return Math.max(0, matchingLen - activeLen);
}

// Simple wrapper around profile view lazy imports
import UserProfileView from './components/UserProfileView';
function InventoryViewPropsWrapper({ 
  currentUser, 
  handleChangeUserCity, 
  handleUpdateBio, 
  handleUpdateName,
  handleTogglePrivateMode
}: { 
  currentUser: UserProfile; 
  handleChangeUserCity: (city: CityLocation) => void;
  handleUpdateBio: (bio: string) => void;
  handleUpdateName: (name: string) => void;
  handleTogglePrivateMode: (enabled: boolean) => void;
}) {
  return (
    <UserProfileView
      user={currentUser}
      onChangeUserCity={handleChangeUserCity}
      onUpdateBio={handleUpdateBio}
      onUpdateName={handleUpdateName}
      onTogglePrivateMode={handleTogglePrivateMode}
    />
  );
}
