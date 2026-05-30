export type StickerStatus = 'tengo' | 'falta' | 'repetida' | 'none';

export interface Sticker {
  id: string; // e.g. "ARG-10"
  team: string; // e.g. "Argentina"
  number: number; // e.g. 10
  name: string; // e.g. "Lionel Messi"
  isSpecial?: boolean;
}

export type CityLocation = 'CABA' | 'Rosario' | 'Córdoba';

export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  city: CityLocation;
  neighborhood: string; // Barrio or precise area
  reputation: number; // 1-5 float
  verified: boolean;
  bio: string;
  reviewsCount: number;
  reviews: Review[];
  stickerCounts: {
    tengo: number;
    falta: number;
    repetida: number;
  };
  privateMode?: boolean;
  isMinor?: boolean;
  tutorEmail?: string;
  tutorVerified?: boolean;
  isDemoMode?: boolean;
  securityPin?: string;
}

export interface CompactStickerState {
  id: string;
  status: StickerStatus;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string; // ISO string
  flagged?: boolean;
  flaggedReason?: string;
}

export interface ChatRoom {
  id: string;
  matchId: string;
  otherUser: UserProfile;
  messages: ChatMessage[];
  lastUpdated: string;
}

export interface SwapMatch {
  id: string;
  otherUser: UserProfile;
  compatibilityScore: number;
  stickersIProvide: string[]; // Stickers they need and I have repeated
  stickersTheyProvide: string[]; // Stickers I need and they have repeated
  status: 'pending' | 'matched' | 'rejected' | 'completed';
}

export interface SafeZone {
  id: string;
  city: CityLocation;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  description: string;
}
