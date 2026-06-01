import React, { useState } from 'react';
import { UserProfile, CityLocation } from '../types';
import { Star, Shield, Award, Edit, Check, MapPin, Layers, RefreshCw, Smile, Lock, Globe } from 'lucide-react';

interface UserProfileViewProps {
  user: UserProfile;
  onChangeUserCity: (city: CityLocation) => void;
  onUpdateBio: (bio: string) => void;
  onUpdateName: (name: string) => void;
  onTogglePrivateMode: (enabled: boolean) => void;
  onUpdateTutorInfo?: (isMinor: boolean, tutorEmail: string, tutorVerified?: boolean) => void;
  onResetDemo?: () => Promise<void>;
  onClearAlbum?: () => Promise<void>;
  onUpdateSecurityPin?: (pin: string) => Promise<void>;
}

export default function UserProfileView({ 
  user, 
  onChangeUserCity, 
  onUpdateBio, 
  onUpdateName, 
  onTogglePrivateMode, 
  onUpdateTutorInfo, 
  onResetDemo, 
  onClearAlbum,
  onUpdateSecurityPin
}: UserProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.displayName);
  const [editedBio, setEditedBio] = useState(user.bio);
  const [editedCity, setEditedCity] = useState<CityLocation>(user.city);
  const [isMinor, setIsMinor] = useState(user.isMinor || false);
  const [tutorEmail, setTutorEmail] = useState(user.tutorEmail || '');

  // PIN states for tutor authentication
  const [pinInput, setPinInput] = useState('');
  const [showPinError, setShowPinError] = useState(false);

  // Security action PIN states (for reset and clear album)
  const [showPinModalForAction, setShowPinModalForAction] = useState<'reset' | 'clear' | null>(null);
  const [securityPinInput, setSecurityPinInput] = useState('');
  const [securityPinError, setSecurityPinError] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // New PIN input state
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [pinChangeError, setPinChangeError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

  const verifyTutorPin = () => {
    if (pinInput === '1234') {
      setShowPinError(false);
      if (onUpdateTutorInfo) {
        onUpdateTutorInfo(true, user.tutorEmail || tutorEmail, true);
      }
    } else {
      setShowPinError(true);
    }
  };

  const handleActionWithPin = async () => {
    const requiredPin = user.securityPin || '1234';
    if (securityPinInput === requiredPin) {
      setSecurityPinError(false);
      setActionInProgress(true);
      const action = showPinModalForAction;
      try {
        if (action === 'clear' && onClearAlbum) {
          await onClearAlbum();
        } else if (action === 'reset' && onResetDemo) {
          await onResetDemo();
        }
        setShowPinModalForAction(null);
        setSecurityPinInput('');
      } catch (err) {
        console.error("Action error:", err);
      } finally {
        setActionInProgress(false);
      }
    } else {
      setSecurityPinError(true);
    }
  };

  const handleSaveNewPin = async () => {
    if (newPinInput.length !== 4) {
      setPinChangeError(true);
      return;
    }
    if (!onUpdateSecurityPin) return;

    setIsChangingPin(true);
    setPinChangeError(false);
    setPinChangeSuccess(false);
    try {
      await onUpdateSecurityPin(newPinInput);
      setPinChangeSuccess(true);
      setNewPinInput('');
      // Clear success indicator after 3 seconds
      setTimeout(() => setPinChangeSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating security PIN:", err);
      setPinChangeError(true);
    } finally {
      setIsChangingPin(false);
    }
  };

  const saveProfile = () => {
    onUpdateName(editedName);
    onUpdateBio(editedBio);
    onChangeUserCity(editedCity);
    if (onUpdateTutorInfo) {
      onUpdateTutorInfo(isMinor, tutorEmail, isMinor ? user.tutorVerified : false);
    }
    setIsEditing(false);
  };

  const totalStickers = 994; // 980 standard + 14 specials
  const percentComplete = Math.min(100, Math.round((user.stickerCounts.tengo / totalStickers) * 100));


  return (
    <div className="space-y-4" id="user-profile-view">
      {/* Header Profile Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col items-center text-center">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/5 rounded-full blur-2xl" />

        {/* User image placeholder or true image */}
        <div className="relative">
          <img
            src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'}
            alt={user.displayName}
            className="h-20 w-20 rounded-full border-3 border-emerald-400 object-cover shadow-md"
            referrerPolicy="no-referrer"
          />
          {user.verified && (
            <span className="absolute bottom-0 right-1 p-1 bg-emerald-500 rounded-full text-neutral-900 border-2 border-neutral-900" title="Coleccionista Verificado">
              <Shield className="h-3.5 w-3.5 stroke-[3px]" />
            </span>
          )}
        </div>

        {/* Name and badge */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <h2 className="text-base font-bold text-neutral-100">{user.displayName}</h2>
          {user.verified && (
            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Award className="h-2.5 w-2.5" /> Verificado
            </span>
          )}
        </div>

        {/* Location tag */}
        <p className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
          <span>{user.city} — {user.neighborhood || 'Barrio Centro'}</span>
        </p>

        {/* Repu rating stars */}
        <div className="mt-2.5 flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-full border border-neutral-800">
          <div className="flex items-center text-amber-500">
            {Array.from({ length: 5 }, (_, idx) => (
              <Star
                key={idx}
                className={`h-3 w-3 ${
                  idx < Math.floor(user.reputation) ? 'fill-amber-500' : 'text-neutral-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-neutral-200">{user.reputation.toFixed(1)}</span>
          <span className="text-[10px] text-neutral-400">({user.reviewsCount} canjes)</span>
        </div>

        {/* Tutor Verification Status */}
        {user.isMinor && (
          <div className="mt-3 w-full max-w-xs">
            {user.tutorVerified ? (
              <div className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 py-1.5 px-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-[inset_0_0_8px_rgba(16,185,129,0.06)] animate-fade-in">
                <Shield className="h-3.5 w-3.5" />
                <span>TUTOR VERIFICADO: {user.tutorEmail}</span>
              </div>
            ) : (
              <div className="bg-amber-550/5 border border-amber-500/25 text-amber-300 py-2.5 px-3 rounded-xl text-[10px] space-y-2 animate-pulse shadow-md">
                <div className="font-bold flex items-center justify-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                  <span>TUTOR PENDIENTE: {user.tutorEmail || 'Sin correo registrado'}</span>
                </div>
                {user.tutorEmail ? (
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-neutral-400 leading-snug">Ingresá el PIN de 4 dígitos enviado a tu tutor para habilitar la app.</p>
                    <div className="flex gap-1.5 justify-center">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="PIN"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-center font-bold tracking-widest text-[11px] outline-none w-20 text-neutral-200 focus:border-amber-500/40"
                      />
                      <button
                        onClick={verifyTutorPin}
                        className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-3 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Validar
                      </button>
                    </div>
                    {showPinError && (
                      <span className="text-[9px] text-rose-450 block font-semibold">PIN incorrecto. Intenta con "1234".</span>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] text-neutral-500 leading-snug">Marcá tu perfil como editable arriba y colocá el correo de tu tutor.</p>
                )}
              </div>
            )}
          </div>
        )}


        {/* Bio */}
        <p className="text-xs text-neutral-300 mt-3.5 max-w-sm leading-relaxed italic">
          "{user.bio}"
        </p>

        {/* Edit Toggle */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="mt-4 px-3 py-1.5 text-xs font-semibold border border-neutral-800 hover:bg-neutral-800 text-neutral-300 rounded-lg flex items-center gap-1.5 transition-colors absolute top-2 right-2"
        >
          {isEditing ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Edit className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{isEditing ? 'Cerrar' : 'Editar'}</span>
        </button>
      </div>

      {/* Editing overlay block */}
      {isEditing && (
        <div className="bg-neutral-900 border border-emerald-500/20 rounded-2xl p-4 shadow-lg space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Modificar mis datos de canje</h3>
          
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-neutral-400 font-bold mb-1 uppercase">Apodo del Coleccionista</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-neutral-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 font-bold mb-1 uppercase">Presentación / Bio de Intercambio</label>
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                rows={2}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-neutral-200 outline-none resize-none"
              />
            </div>

            {/* Control de Menores (Tutor) */}
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                <input
                  type="checkbox"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                  className="rounded border-neutral-800 text-emerald-500 focus:ring-emerald-500 bg-neutral-900 h-4 w-4"
                />
                <span>Soy menor de edad (requiere tutor) 🛡️</span>
              </label>

              {isMinor && (
                <div className="animate-fade-in space-y-1">
                  <label className="block text-[9px] text-neutral-400 font-bold uppercase">Email de mi Adulto Responsable (Tutor)</label>
                  <input
                    type="email"
                    placeholder="ej: tutor.mama.papa@gmail.com"
                    value={tutorEmail}
                    onChange={(e) => setTutorEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-neutral-200 outline-none"
                  />
                  <span className="text-[8px] text-neutral-500 block leading-snug">Se le enviará un código temporal de autorización para validar su cuenta.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-400 font-bold mb-1 uppercase">Provincia/Ciudad</label>
                <select
                  value={editedCity}
                  onChange={(e) => setEditedCity(e.target.value as CityLocation)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-neutral-200 outline-none"
                >
                  <option value="CABA">CABA</option>
                  <option value="Rosario">Rosario</option>
                  <option value="Córdoba">Córdoba</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={saveProfile}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracker Mode Selection Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {user.privateMode ? (
                <span className="text-amber-500 flex items-center gap-1.5">
                  <Lock className="h-4 w-4" /> Modo Control Personal
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Globe className="h-4 w-4" /> Modo Intercambio Activo
                </span>
              )}
            </h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {user.privateMode 
                ? "Estás usando la app 100% como control personal. Tu perfil es invisible para otros y no recibirás sugerencias de canjes ni mensajes directos."
                : "Estás buscando completar tu álbum intercambiando. Tu perfil es visible para sugerir canjes automáticos con coleccionistas cercanos."}
            </p>
          </div>

          <button
            onClick={() => onTogglePrivateMode(!user.privateMode)}
            className={`shrink-0 w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
              user.privateMode ? 'bg-amber-500' : 'bg-neutral-800 border border-neutral-700'
            }`}
            id="toggle-private-mode-button"
            title={user.privateMode ? "Cambiar a modo social" : "Cambiar a modo privado"}
          >
            <div
              className={`bg-neutral-950 w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                user.privateMode ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            >
              {user.privateMode ? <Lock className="h-2.5 w-2.5 text-amber-500" /> : <Globe className="h-2.5 w-2.5 text-neutral-400" />}
            </div>
          </button>
        </div>

        {/* Informative alert box inside the mode card */}
        <div className={`p-2.5 rounded-xl text-[10px] leading-snug border ${
          user.privateMode 
            ? 'bg-neutral-950 border-neutral-850 text-neutral-450' 
            : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
        }`}>
          {user.privateMode ? (
            <p>
              🔒 <strong>Privacidad total activa:</strong> Se ocultan y suspenden las secciones de <em>Matcher</em>, <em>Zonas Seguras</em> y <em>Chats</em> para que puedas controlar tus figuritas en paz. Podés volver a interactuar cuando quieras.
            </p>
          ) : (
            <p>
              🤝 <strong>Conexión habilitada:</strong> El buscador inteligente analizará tus repetidas y faltantes para emparejarte al instante con gente de {user.city}.
            </p>
          )}
        </div>
      </div>

      {/* Album Progress Metrics */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-md space-y-3">
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-emerald-400" /> Mi Progreso del Álbum
        </h3>

        {/* Stats progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-400">Figuritas Pegadas</span>
            <span className="text-emerald-400">{user.stickerCounts.tengo} / {totalStickers} ({percentComplete}%)</span>
          </div>
          <div className="h-3 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-neutral-850 text-center">
          <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/80">
            <span className="block text-base font-bold text-neutral-200">{user.stickerCounts.tengo}</span>
            <span className="text-[10px] text-neutral-400 font-medium">Pegadas</span>
          </div>
          <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-805/80">
            <span className="block text-base font-bold text-amber-500">{user.stickerCounts.falta}</span>
            <span className="text-[10px] text-neutral-400 font-medium">Buscadas</span>
          </div>
          <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-805/80">
            <span className="block text-base font-bold text-emerald-400">{user.stickerCounts.repetida}</span>
            <span className="text-[10px] text-neutral-400 font-medium font-mono">Repetidas</span>
          </div>
        </div>
      </div>

      {/* Trust & Reviews lists */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-md space-y-3">
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <Smile className="h-4 w-4 text-amber-500" /> Comentarios de Canjeadores ({user.reviewsCount})
        </h3>

        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {user.reviews && user.reviews.length > 0 ? (
            user.reviews.map((rev) => (
              <div key={rev.id} className="p-3 bg-neutral-950 rounded-xl space-y-1 text-[11px] border border-neutral-850">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200">{rev.reviewerName}</span>
                  <div className="flex items-center text-amber-500 gap-0.5">
                    {Array.from({ length: 5 }, (_, idx) => (
                      <Star key={idx} className={`h-2.5 w-2.5 ${idx < rev.rating ? 'fill-amber-500' : 'text-neutral-700'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-neutral-300 italic">
                  "{rev.comment}"
                </p>
                <div className="text-[9px] text-neutral-500 text-right">{rev.date}</div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 text-center py-4">No has realizado transacciones físicas QR registradas aún.</p>
          )}
        </div>
      </div>
      
      {/* Developer Promotion Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-emerald-950/10 to-neutral-900 border border-emerald-500/10 rounded-2xl p-5 shadow-lg relative overflow-hidden text-center space-y-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.03)_0%,_transparent_75%)] pointer-events-none" />
        
        <div className="space-y-1.5 z-10 relative">
          <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest block">
            Desarrollador de la Aplicación
          </span>
          <h3 className="text-sm font-bold text-neutral-100">
            Max <span className="text-emerald-400 font-medium">(MaxDevs Solutions)</span>
          </h3>
          <p className="text-[11px] text-neutral-400 leading-relaxed max-w-sm mx-auto">
            FiguSwap Argentina es un proyecto 100% gratuito y libre de publicidad. Si te ayudó a completar tu álbum, podés apoyar a su creador con una donación voluntaria para financiar futuros desarrollos independientes.
          </p>
        </div>

        <div className="pt-1.5 z-10 relative flex flex-wrap gap-2 justify-center">
          <a
            href="https://cafecito.app/maxdevssolutions"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>☕ Invitar un Cafecito</span>
          </a>
          <a
            href="https://maxdevssolutions.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Visitar maxdevssolutions.com</span>
          </a>
        </div>
      </div>

      {/* Reset Demo Data / Real Album Card */}
      {(onResetDemo || onClearAlbum) && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-450" /> Configuración de Control de Álbum
            </h3>
            <p className="text-[11px] text-neutral-450 leading-relaxed">
              Selecciona cómo deseas gestionar los datos de tu colección en esta sesión. Puedes comenzar de cero con tu colección real o precargar datos de demostración.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Start Clean Real Album Button */}
            {onClearAlbum && (
              <button
                onClick={() => {
                  setShowPinModalForAction('clear');
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-center"
                id="clear-album-real-button"
              >
                Comenzar Álbum Real (0%) ⚽
              </button>
            )}

            {/* Reset Demo Button */}
            {onResetDemo && (
              <button
                onClick={() => {
                  setShowPinModalForAction('reset');
                }}
                className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600 text-rose-450 hover:text-rose-400 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center"
                id="reset-demo-button"
              >
                Cargar Demo (64% Completado) 🧪
              </button>
            )}
          </div>

          {/* PIN Configuration Form */}
          {onUpdateSecurityPin && (
            <div className="pt-4 mt-4 border-t border-neutral-850 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200">
                  <Lock className="h-3.5 w-3.5 text-rose-500" />
                  <span>PIN de Seguridad del Álbum</span>
                </div>
                <span className="text-[9px] font-mono bg-neutral-950 text-neutral-450 border border-neutral-800 px-2 py-0.5 rounded-md">
                  PIN actual: {user.securityPin ? '•••• (Personalizado)' : '1234 (Por defecto)'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-normal">
                Para evitar borrados accidentales de tu progreso, configura un PIN numérico de 4 dígitos.
              </p>
              
              <div className="flex gap-2 items-center">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Nuevo PIN"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="bg-neutral-950 border border-neutral-800 focus:border-rose-500/40 rounded-lg py-2 px-3 text-center font-bold tracking-widest text-xs outline-none w-28 text-neutral-200"
                />
                <button
                  onClick={handleSaveNewPin}
                  disabled={newPinInput.length !== 4 || isChangingPin}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-850 disabled:text-neutral-500 active:scale-95 text-neutral-950 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  {isChangingPin ? 'Guardando...' : 'Cambiar PIN'}
                </button>
              </div>

              {pinChangeSuccess && (
                <div className="text-[9px] text-emerald-400 font-bold animate-fade-in">
                  ✓ ¡PIN actualizado correctamente!
                </div>
              )}
              {pinChangeError && (
                <div className="text-[9px] text-rose-450 block font-semibold animate-fade-in">
                  ✗ Error al actualizar el PIN. Asegúrate de ingresar exactamente 4 números.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECURITY ACTION PIN CONFIRMATION MODAL */}
      {showPinModalForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-neutral-900 border-2 border-rose-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/25 text-rose-400">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">Confirmación de Seguridad</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Para evitar borrados accidentales de tu progreso, ingresá tu PIN de autorización de 4 números {user.securityPin ? '' : '(por defecto: '}<b className="text-neutral-200">{user.securityPin ? 'personalizado' : '1234'}</b>{user.securityPin ? '' : ')'}:
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3">
              <div className="flex gap-2 justify-center items-center">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="PIN"
                  value={securityPinInput}
                  onChange={(e) => setSecurityPinInput(e.target.value.replace(/\D/g, ''))}
                  disabled={actionInProgress}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg py-2 px-3 text-center font-bold tracking-widest text-sm outline-none w-24 text-neutral-200 focus:border-rose-500/40 disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleActionWithPin();
                  }}
                />
                <button
                  onClick={handleActionWithPin}
                  disabled={actionInProgress}
                  className="bg-rose-500 hover:bg-rose-600 disabled:bg-neutral-850 disabled:text-neutral-500 active:scale-95 text-neutral-950 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer"
                >
                  {actionInProgress ? "Procesando..." : "Autorizar"}
                </button>
              </div>
              {securityPinError && (
                <span className="text-[9px] text-rose-450 block font-semibold">Código incorrecto. ¡Acceso denegado!</span>
              )}
            </div>

            <button
              onClick={() => {
                setShowPinModalForAction(null);
                setSecurityPinInput('');
                setSecurityPinError(false);
              }}
              disabled={actionInProgress}
              className="text-xs text-neutral-500 hover:text-neutral-300 font-semibold uppercase tracking-wider disabled:opacity-55"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
