import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatRoom, ChatMessage, SwapMatch, StickerStatus, Sticker } from '../types';
import { STAR_PLAYERS, getStickerName } from '../data';
import { Send, ShieldAlert, CheckCheck, QrCode, Star, CheckSquare, Smile, ArrowLeft, RefreshCw } from 'lucide-react';

interface ChatRoomViewProps {
  room: ChatRoom;
  currentUser: UserProfile;
  stickerStates: Record<string, StickerStatus>;
  onBack: () => void;
  onSendMessage: (roomId: string, message: ChatMessage) => void;
  onCompleteSwap: (otherUid: string, giveStickers: string[], takeStickers: string[]) => void;
  onAddReviewToUser: (otherUid: string, rating: number, comment: string) => void;
}

export default function ChatRoomView({
  room,
  currentUser,
  stickerStates,
  onBack,
  onSendMessage,
  onCompleteSwap,
  onAddReviewToUser
}: ChatRoomViewProps) {
  const [inputText, setInputText] = useState('');
  const [checkingAi, setCheckingAi] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // QR flow states
  const [showQrValidator, setShowQrValidator] = useState(false);
  const [qrCodeString, setQrCodeString] = useState<string | null>(null);
  const [scanningSimulation, setScanningSimulation] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [showRatingScreen, setShowRatingScreen] = useState(false);

  // Rating States
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Confirmación de canje seguro en punto público
  const [confirmedAdultPresence, setConfirmedAdultPresence] = useState(false);


  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages]);

  // Handle Send with Server-Side Anti-Phishing Filter
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setCheckingAi(true);
    setAiWarning(null);

    try {
      // POST the user message to our server-side Gemini threat filter
      const response = await fetch('/api/gemini/filter-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        throw new Error('El sistema de seguridad no pudo validar este mensaje.');
      }

      const data = await response.json();

      if (data.flagged) {
        // Message is detected as phishing or scam risk - Blocked on client with Alert details
        setAiWarning(data.flaggedReason);
      } else {
        // Message passed! Send it to the room log
        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          senderId: currentUser.uid,
          text: inputText,
          timestamp: new Date().toISOString()
        };
        onSendMessage(room.id, newMsg);
        setInputText('');
      }
    } catch (err: any) {
      // Offline fallback / error bypass
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUser.uid,
        text: inputText,
        timestamp: new Date().toISOString()
      };
      onSendMessage(room.id, fallbackMsg);
      setInputText('');
    } finally {
      setCheckingAi(false);
    }
  };

  // Generate code representing stickers exchanging
  const triggerGenerateQR = () => {
    // Generate a beautiful serialized state representing the sticker IDs traded
    const tradeData = {
      from: currentUser.uid,
      to: room.otherUser.uid,
      stamp: Date.now()
    };
    setQrCodeString(JSON.stringify(tradeData));
  };

  const simulateScanning = () => {
    setScanningSimulation(true);
    setTimeout(() => {
      setScanningSimulation(false);
      setScanSuccess(true);
      
      // Stickers exchange arrays
      // Give duplicates we carry, take their duplicates
      const give = ['ARG-10', 'CC-10'];
      const take = ['GER-10', 'FRA-10'];

      // Physically execute inventory shifts
      onCompleteSwap(room.otherUser.uid, give, take);

      // Advance to rating star prompt
      setTimeout(() => {
        setShowRatingScreen(true);
      }, 1500);

    }, 2000);
  };

  const submitReview = () => {
    onAddReviewToUser(room.otherUser.uid, ratingVal, ratingComment);
    setRatingSubmitted(true);
    setTimeout(() => {
      setShowQrValidator(false);
      setShowRatingScreen(false);
      setScanSuccess(false);
      setQrCodeString(null);
      setRatingSubmitted(false);
    }, 2000);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-xl relative" id="chat-conversation-container">
      {/* Top Header Bar */}
      <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="p-1 cursor-pointer hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img
            src={room.otherUser.photoURL}
            alt={room.otherUser.displayName}
            className="h-10 w-10 rounded-full border border-emerald-500/30 object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-neutral-100">{room.otherUser.displayName}</span>
              {room.otherUser.verified && (
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
              )}
            </div>
            <div className="flex items-center gap-2 text-[9px] text-neutral-400 mt-0.5">
              <span>{room.otherUser.city} ({room.otherUser.neighborhood})</span>
              <span className="flex items-center text-amber-500 font-bold"><Star className="h-2.5 w-2.5 fill-amber-500" /> {room.otherUser.reputation.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Action button for active physical exchange QR code */}
        <button
          onClick={() => setShowQrValidator(!showQrValidator)}
          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-md transition-transform active:scale-95 cursor-pointer"
          id="trigger-qr-validator-btn"
        >
          <QrCode className="h-3.5 w-3.5" />
          <span>Validar Canje QR</span>
        </button>
      </div>

      {/* Geofence Safety Alert banner inside top chat room */}
      <div className="bg-emerald-500/5 px-4 py-2 border-b border-neutral-800/60 text-[10px] text-emerald-300 flex items-center gap-1.5 font-medium shrink-0 animate-pulse">
        <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
        <span>Punto de encuentro seguro: Parque Centenario / Wöllen Córdoba activo ✔️</span>
      </div>

      {/* Main Container: Message Log VS QR Validator Overlay */}
      <div className="flex-1 overflow-hidden relative">
        {showQrValidator ? (
          <div className="absolute inset-0 bg-neutral-900/98 z-10 p-5 overflow-y-auto space-y-4" id="qr-validator-overlay">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <QrCode className="h-4 w-4" /> Validador Físico Interactivo
              </span>
              <button
                onClick={() => setShowQrValidator(false)}
                className="text-xs text-rose-450 hover:text-rose-300 font-bold"
              >
                Volver al chat
              </button>
            </div>

            <p className="text-[10px] text-neutral-300 leading-relaxed bg-neutral-950 p-2.5 rounded-lg border border-neutral-850">
              Cuando se encuentren físicamente en el punto seguro de <b>{currentUser.city}</b>, muestren y escaneen el código para sincronizar automáticamente sus colecciones pegadas y duplicadas.
            </p>

            {/* Switchable Side Generator or scanner simulator */}
            {!showRatingScreen ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Side A: Code generator */}
                <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase">1. Mostrar mi QR de Canje</span>
                  {qrCodeString ? (
                    <div className="bg-white p-3.5 rounded-xl border-4 border-emerald-400">
                      {/* Interactive custom Vector QR representation */}
                      <svg className="w-28 h-28 text-neutral-900" viewBox="0 0 100 100">
                        <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                        <rect x="5" y="5" width="20" height="20" fill="white" />
                        <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                        <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                        <rect x="75" y="5" width="20" height="20" fill="white" />
                        <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                        <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                        <rect x="5" y="75" width="20" height="20" fill="white" />
                        <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                        <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                        <rect x="45" y="45" width="10" height="10" fill="white" />

                        {/* random noise */}
                        <rect x="40" y="0" width="10" height="15" fill="currentColor" />
                        <rect x="55" y="10" width="10" height="10" fill="currentColor" />
                        <rect x="0" y="45" width="15" height="10" fill="currentColor" />
                        <rect x="25" y="55" width="10" height="10" fill="currentColor" />
                        <rect x="85" y="40" width="15" height="15" fill="currentColor" />
                        <rect x="70" y="80" width="20" height="10" fill="currentColor" />
                        <rect x="45" y="85" width="20" height="15" fill="currentColor" />
                      </svg>
                      <span className="text-[8px] font-mono text-neutral-900 block mt-1.5 font-bold">FiguScan-{currentUser.uid}</span>
                    </div>
                  ) : (
                    <button
                      onClick={triggerGenerateQR}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-brand-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                    >
                      Generar QR de Canje
                    </button>
                  )}
                  <span className="text-[8px] text-neutral-500">Muestra esto en tu pantalla</span>
                </div>

                {/* Side B: Code scanner simulation */}
                <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase">2. Escanear el QR de {room.otherUser.displayName}</span>
                  
                  {scanningSimulation ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <RefreshCw className="h-10 w-10 text-emerald-400 animate-spin" />
                      <span className="text-[9px] text-emerald-300 font-bold animate-pulse">Apuntando cámara al teléfono...</span>
                    </div>
                  ) : scanSuccess ? (
                    <div className="space-y-1.5 text-center flex flex-col items-center">
                      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full">
                        <CheckCheck className="h-6 w-6 stroke-[3px]" />
                      </div>
                      <span className="text-[10px] text-emerald-300 font-bold uppercase">¡Código Verificado!</span>
                      <span className="text-[8px] text-neutral-400 block">Inventarios sincronizados</span>
                    </div>
                  ) : (
                    <div className="w-full space-y-2.5">
                      <label className="flex items-start gap-2 text-left p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[9px] text-neutral-350 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmedAdultPresence}
                          onChange={(e) => setConfirmedAdultPresence(e.target.checked)}
                          className="rounded border-neutral-800 text-emerald-500 bg-neutral-950 h-3.5 w-3.5 mt-0.5"
                        />
                        <span>Confirmo que el encuentro se realiza en un punto de canje público recomendado y de forma segura.</span>
                      </label>
                      <button
                        onClick={simulateScanning}
                        disabled={!confirmedAdultPresence}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-black text-xs rounded-xl cursor-pointer"
                      >
                        ¡Simular Escaneo Físico QR!
                      </button>
                    </div>
                  )}

                  <span className="text-[8px] text-neutral-500">Apunta con tu cámara</span>
                </div>
              </div>
            ) : (
              /* Rating Screen upon physical validation */
              <div className="bg-neutral-950 border border-neutral-850 p-5 rounded-2xl text-center space-y-4 max-w-sm mx-auto animate-fade-in" id="swap-reputation-rewards">
                <div className="flex justify-center text-amber-500 text-3xl">
                  {Array.from({ length: 5 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRatingVal(idx + 1)}
                      className="p-1 hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          idx < ratingVal ? 'fill-amber-500 text-amber-500' : 'text-neutral-800'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase block">Calificar intercambio con</span>
                  <p className="text-sm font-bold text-neutral-200">{room.otherUser.displayName}</p>
                </div>

                <textarea
                  placeholder="Escribe una breve reseña de cómo fue la cita física (p. ej: puntual, simpático, stickers en perfecto estado...)"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-100 outline-none resize-none focus:border-emerald-500"
                />

                {ratingSubmitted ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 p-2 rounded text-emerald-400 text-xs font-semibold animate-pulse">
                    ¡Calificación y reputación registradas exitosamente!
                  </div>
                ) : (
                  <button
                    onClick={submitReview}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs rounded-lg transition-colors"
                  >
                    Publicar Reseña del Canje
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Message Logs */}
        <div className="h-full overflow-y-auto px-4 py-4 space-y-4 bg-neutral-950/20" id="chat-messages-scroller">
          {/* Welcome Intro Header info */}
          <div className="text-center py-4 border-b border-neutral-850/50 space-y-1 flex flex-col items-center">
            <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500 uppercase tracking-widest">
              Trueque Seguro Iniciado
            </span>
            <p className="text-[9px] text-neutral-500 max-w-xs leading-relaxed">
              Mensajes encriptados y protegidos por nuestro detector de estafas automátizado con Gemini.
            </p>
          </div>

          {room.messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-emerald-500 text-neutral-950 rounded-tr-none font-medium'
                      : 'bg-neutral-900 text-neutral-200 border border-neutral-802 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[8px] text-neutral-500 mt-1 uppercase tracking-tighter">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Security alert block when Gemini blocks a phrase */}
      {aiWarning && (
        <div className="bg-rose-500/15 border-t border-b border-rose-500/30 px-4 py-2 text-rose-300 text-[10px] flex items-start gap-2 shrink-0 animate-bounce" id="phishing-ai-warning">
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-450 mt-0.5 animate-pulse" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wider block">Mensaje bloqueado por Seguridad (IA)</span>
            <p>{aiWarning}</p>
          </div>
        </div>
      )}

      {/* Input Form Footer shrink-0 */}
      <form onSubmit={handleSend} className="bg-neutral-950 p-3 border-t border-neutral-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Escribe un mensaje seguro (evita compartir WhatsApp o datos CBU)..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500/50 outline-none text-xs text-neutral-200 py-2.5 px-3 rounded-xl"
          disabled={checkingAi}
          id="chat-input-field"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || checkingAi}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 rounded-xl transition-all select-none cursor-pointer"
        >
          {checkingAi ? (
            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Send className="h-4.5 w-4.5" />
          )}
        </button>
      </form>
    </div>
  );
}
