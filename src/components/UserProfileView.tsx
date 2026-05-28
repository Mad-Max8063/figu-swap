import React, { useState } from 'react';
import { UserProfile, CityLocation } from '../types';
import { Star, Shield, Award, Edit, Check, MapPin, Layers, RefreshCw, Smile, Lock, Globe } from 'lucide-react';

interface UserProfileViewProps {
  user: UserProfile;
  onChangeUserCity: (city: CityLocation) => void;
  onUpdateBio: (bio: string) => void;
  onUpdateName: (name: string) => void;
  onTogglePrivateMode: (enabled: boolean) => void;
}

export default function UserProfileView({ user, onChangeUserCity, onUpdateBio, onUpdateName, onTogglePrivateMode }: UserProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.displayName);
  const [editedBio, setEditedBio] = useState(user.bio);
  const [editedCity, setEditedCity] = useState<CityLocation>(user.city);

  const saveProfile = () => {
    onUpdateName(editedName);
    onUpdateBio(editedBio);
    onChangeUserCity(editedCity);
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
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs rounded-lg transition-colors"
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
    </div>
  );
}
