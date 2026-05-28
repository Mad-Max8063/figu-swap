import React, { useState, useEffect } from 'react';
import { UserProfile, SwapMatch, StickerStatus } from '../types';
import { MOCK_COLLECTORS, ALL_STICKERS } from '../data';
import { Heart, X, Sparkles, MapPin, Star, Shield, ArrowUpRight, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface MatchEngineProps {
  currentUser: UserProfile;
  stickerStates: Record<string, StickerStatus>;
  onUnlockChat: (otherUser: UserProfile, match: SwapMatch) => void;
  activeMatches: SwapMatch[];
  setActiveMatches: React.Dispatch<React.SetStateAction<SwapMatch[]>>;
}

export default function MatchEngine({
  currentUser,
  stickerStates,
  onUnlockChat,
  activeMatches,
  setActiveMatches
}: MatchEngineProps) {
  const [deck, setDeck] = useState<SwapMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState<SwapMatch | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);


  // Recalculate sticker overlap and compatibility dynamically based on current user's state!
  useEffect(() => {
    // 1. Identify which stickers current user needs and has repeated
    const myNeededIds = ALL_STICKERS.filter(s => stickerStates[s.id] === 'falta').map(s => s.id);
    const myRepeatedIds = ALL_STICKERS.filter(s => stickerStates[s.id] === 'repetida').map(s => s.id);

    // 2. Map through other collectors residing in the same general City Location
    const localCollectors = MOCK_RECORDS_FOR_CITY(currentUser.city);

    const matchesList: SwapMatch[] = localCollectors.map((collector, index) => {
      // In a real app we would query Firestore, here we simulate their duplicates based on high-integrity models
      const collectorRepeated = getSimulatedDuplicatesForUser(collector.uid);
      const collectorNeeds = getSimulatedNeededForUser(collector.uid, myRepeatedIds);

      // What I can give them (I have repeated, they need)
      const iProvide = myRepeatedIds.filter(id => collectorNeeds.includes(id));
      // What they can give me (They have repeated, I need)
      const theyProvide = collectorRepeated.filter(id => myNeededIds.includes(id));

      // Compatibility score is weighted overlap count
      const totalTradable = iProvide.length + theyProvide.length;
      const score = Math.round(
        totalTradable > 0 ? (totalTradable / (myNeededIds.length + myRepeatedIds.length || 20)) * 100 + 40 : 10
      );

      return {
        id: `match-sim-${collector.uid}-${index}`,
        otherUser: collector,
        compatibilityScore: Math.min(99, score > 0 ? score : Math.floor(Math.random() * 30) + 40),
        stickersIProvide: iProvide.length > 0 ? iProvide : pickFallbackMatches(myRepeatedIds, 2),
        stickersTheyProvide: theyProvide.length > 0 ? theyProvide : pickFallbackMatches(myNeededIds, 3),
        status: 'pending'
      };
    });

    // Filter out already processed or active matches
    const activeIds = activeMatches.map(m => m.otherUser.uid);
    const availableCards = matchesList.filter(m => !activeIds.includes(m.otherUser.uid));

    setDeck(availableCards);
    setCurrentIndex(0);
  }, [stickerStates, currentUser.city, activeMatches]);

  const handleSwipe = (liked: boolean) => {
    if (deck.length === 0 || currentIndex >= deck.length || swipeDirection) return;

    setSwipeDirection(liked ? 'right' : 'left');

    const currentCard = deck[currentIndex];
    setTimeout(() => {
      if (liked) {
        // 90% chance of a match in this gamified simulation so they can exchange sticker messages immediately
        const isMatch = Math.random() < 0.9;
        if (isMatch) {
           const matchedCard: SwapMatch = {
             ...currentCard,
             status: 'matched'
           };
           setActiveMatches(prev => [matchedCard, ...prev]);
           setShowMatchModal(matchedCard);
        }
      }
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 350);
  };


  const startChattingFromModal = () => {
    if (showMatchModal) {
      onUnlockChat(showMatchModal.otherUser, showMatchModal);
      setShowMatchModal(null);
    }
  };

  const hasCards = deck.length > 0 && currentIndex < deck.length;
  const activeCard = deck[currentIndex];

  return (
    <div className="space-y-4" id="tinder-swap-engine">
      {/* Dynamic Match Warning / Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <h3 className="text-xs font-bold text-neutral-200">Encontrando canjes en {currentUser.city}</h3>
          <p className="text-[10px] text-neutral-400">Calculado según compatibilidad mutua</p>
        </div>
        <div className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
          {deck.length - currentIndex} candidatos
        </div>
      </div>

      {hasCards ? (
        <div className="relative" id="active-swipe-deck">
          {/* Main Swiping Card */}
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: swipeDirection === 'left' ? -350 : swipeDirection === 'right' ? 350 : 0,
              rotate: swipeDirection === 'left' ? -15 : swipeDirection === 'right' ? 15 : 0
            }}
            transition={{ duration: swipeDirection ? 0.35 : 0.2, ease: "easeOut" }}
            className="bg-neutral-900 border border-neutral-700 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-[400px] relative overflow-hidden"
          >
            {/* Compatibility Badge floating */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 px-3 py-1 rounded-full text-[11px] font-black tracking-wide shadow-md flex items-center gap-1">
              <Sparkles className="h-3 w-3 fill-neutral-950 animate-pulse" />
              <span>{activeCard.compatibilityScore}% Compatible</span>
            </div>

            {/* Profile Brief header */}
            <div className="flex items-center gap-3">
              <img
                src={activeCard.otherUser.photoURL}
                alt={activeCard.otherUser.displayName}
                className="h-14 w-14 rounded-full border-2 border-emerald-450 object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-neutral-100">{activeCard.otherUser.displayName}</span>
                  {activeCard.otherUser.verified && (
                    <Shield className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400/10" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3 text-emerald-400" /> {activeCard.otherUser.city} ({activeCard.otherUser.neighborhood})</span>
                  <span className="flex items-center text-amber-500 font-bold"><Star className="h-3 w-3 fill-amber-500" /> {activeCard.otherUser.reputation.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Middle body: Sticker exchange checklist */}
            <div className="my-5 bg-neutral-950/80 border border-neutral-850 p-4 rounded-2xl space-y-3 shadow-inner">
              {/* What they have that I need */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Te ofrece (Te faltan y él tiene repetidas):
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeCard.stickersTheyProvide.map((id) => (
                    <span
                      key={id}
                      className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-bold font-mono text-[9px] px-1.5 py-0.5 rounded"
                    >
                      {id}
                    </span>
                  ))}
                  {activeCard.stickersTheyProvide.length === 0 && (
                    <span className="text-[10px] text-neutral-500 italic">Intercambiar por acordar</span>
                  )}
                </div>
              </div>

              {/* What I have that they need */}
              <div className="space-y-1 border-t border-neutral-900 pt-2.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Tú le das (Le faltan y tienes repetidas):
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeCard.stickersIProvide.map((id) => (
                    <span
                      key={id}
                      className="bg-amber-500/10 border border-amber-500/25 text-amber-200 font-bold font-mono text-[9px] px-1.5 py-0.5 rounded"
                    >
                      {id}
                    </span>
                  ))}
                  {activeCard.stickersIProvide.length === 0 && (
                    <span className="text-[10px] text-neutral-500 italic">Consultar tu inventario de repes</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom bio */}
            <div className="pb-4">
              <p className="text-xs text-neutral-300 leading-relaxed italic text-center px-4 bg-neutral-950/20 py-2 rounded-xl border border-neutral-850">
                "{activeCard.otherUser.bio}"
              </p>
            </div>

            {/* Action Swiping Buttons */}
            <div className="flex items-center justify-center gap-4 border-t border-neutral-800/50 pt-4 bg-neutral-900">
              <button
                onClick={() => handleSwipe(false)}
                className="p-3.5 bg-neutral-800 hover:bg-neutral-750 text-rose-450 border border-rose-500/10 rounded-full transition-all hover:scale-105"
                title="Siguiente recolector"
              >
                <X className="h-6 w-6 stroke-[2.5px]" />
              </button>
              <button
                onClick={() => handleSwipe(true)}
                className="p-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all hover:scale-110 flex items-center justify-center"
                title="Enviar propuesta de trueque"
              >
                <Heart className="h-7 w-7 fill-neutral-950 stroke-[2px]" />
              </button>
            </div>
          </motion.div>

        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl text-center space-y-3 shadow-lg">
          <div className="p-3 bg-neutral-950 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-neutral-805 text-emerald-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <p className="text-xs text-neutral-300 font-semibold">
            ¡Has recorrido todos los coleccionistas compatibles hoy!
          </p>
          <p className="text-[10px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
            Puedes cambiar tu provincia / barrio en 'Mi Perfil' o cargar más stickers duplicados en el Álbum para recalculas sinergias instantáneas.
          </p>
        </div>
      )}

      {/* MATCH REWARD MODAL OVERLAY */}
      {showMatchModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4" 
          id="match-celebration-popup"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="bg-neutral-900 border-2 border-emerald-400 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-[0_0_30px_rgba(52,211,153,0.3)] select-none"
          >
            <div className="relative inline-block">
              {/* Pulsing effects */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full blur-sm opacity-75 animate-pulse" />
              <div className="relative p-3 bg-neutral-950 rounded-full flex items-center justify-center text-emerald-400">
                <Sparkles className="h-8 w-8 animate-spin-slow" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 uppercase tracking-widest">
                ¡Es un MATCH!
              </h2>
              <p className="text-xs text-neutral-200">
                ¡Ambos se mostraron interesados en sus repetidas!
              </p>
            </div>

            {/* Split avatars */}
            <div className="flex items-center justify-center -space-x-4">
              <img
                src={currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'}
                alt="Yo"
                className="h-16 w-16 rounded-full border-2 border-neutral-900 object-cover"
                referrerPolicy="no-referrer"
              />
              <img
                src={showMatchModal.otherUser.photoURL}
                alt={showMatchModal.otherUser.displayName}
                className="h-16 w-16 rounded-full border-2 border-emerald-400 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 text-left space-y-1.5">
              <span className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider block text-center">Intercambio Sugerido de Figus:</span>
              <div className="text-[10px] text-neutral-300 flex justify-between gap-1 border-t border-neutral-900 pt-1">
                <span>Él te entrega:</span>
                <span className="font-mono font-bold text-emerald-300">{showMatchModal.stickersTheyProvide.slice(0, 3).join(', ')}</span>
              </div>
              <div className="text-[10px] text-neutral-300 flex justify-between gap-1">
                <span>Tú le entregas:</span>
                <span className="font-mono font-bold text-amber-300">{showMatchModal.stickersIProvide.slice(0, 3).join(', ')}</span>
              </div>
            </div>


            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={startChattingFromModal}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                <MessageCircle className="h-4 w-4" />
                Chatear para coordinar canje
              </button>
              <button
                onClick={() => setShowMatchModal(null)}
                className="w-full py-1.5 text-xs text-neutral-400 font-semibold hover:text-white"
              >
                Seguir buscando coincidenias
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}

// Helper to match correct collectors based on the city filter selected by user
function MOCK_RECORDS_FOR_CITY(city: string): UserProfile[] {
  return MOCK_COLLECTORS.filter(c => c.city === city);
}

// Generate realistic duplicates vectors
function getSimulatedDuplicatesForUser(userId: string): string[] {
  if (userId === 'u2') return ['ARG-10', 'ARG-11', 'CC-1', 'ESP-17'];
  if (userId === 'u3') return ['GER-10', 'GER-17', 'FRA-10', 'URU-15'];
  if (userId === 'u4') return ['CC-10', 'CC-14', 'ARG-1', 'JPN-20'];
  return ['FRA-7', 'ARG-8', 'ESP-8', 'CC-2'];
}

function getSimulatedNeededForUser(userId: string, myRepeated: string[]): string[] {
  // Simulate which ones they are lacking
  if (myRepeated.length > 0) return [myRepeated[0]];
  if (userId === 'u2') return ['CC-10', 'FRA-10', 'GER-10'];
  if (userId === 'u3') return ['ARG-10', 'ARG-11', 'CC-1'];
  return ['URU-15', 'ESP-17', 'ARG-20'];
}

function pickFallbackMatches(arr: string[], count: number): string[] {
  if (arr.length > 0) return arr.slice(0, count);
  // Default values
  const allDefaults = ['ARG-10', 'ESP-17', 'CC-10', 'FRA-10', 'GER-10'];
  return allDefaults.slice(0, count);
}
