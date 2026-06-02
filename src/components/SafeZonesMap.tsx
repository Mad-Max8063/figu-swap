import React, { useState } from 'react';
import { SAFE_ZONES } from '../data';
import { SafeZone, CityLocation } from '../types';
import { MapPin, Shield, Map as MapIcon, Compass, CheckCircle, Navigation, Info, Users } from 'lucide-react';

export default function SafeZonesMap() {
  const [selectedCity, setSelectedCity] = useState<CityLocation>('CABA');
  const [selectedZone, setSelectedZone] = useState<SafeZone>(
    SAFE_ZONES.find((z) => z.city === 'CABA') || SAFE_ZONES[0]
  );

  const filteredZones = SAFE_ZONES.filter((z) => z.city === selectedCity);

  const selectCityHandler = (city: CityLocation) => {
    setSelectedCity(city);
    const firstZone = SAFE_ZONES.find((z) => z.city === city);
    if (firstZone) {
      setSelectedZone(firstZone);
    }
  };

  return (
    <div className="space-y-4" id="safe-zones-container">
      {/* City Toggles */}
      <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl flex items-center justify-between gap-1.5 shadow-md">
        <div className="flex items-center gap-2 px-2 text-neutral-400">
          <Compass className="h-4 w-4 text-emerald-400 animate-spin-slow" />
          <span className="text-[11px] font-bold tracking-wider uppercase">Localizar:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {(['CABA', 'Rosario', 'Córdoba'] as CityLocation[]).map((city) => (
            <button
              key={city}
              onClick={() => selectCityHandler(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCity === city
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Visual Mockup */}
      <div className="relative h-64 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-between p-4 shadow-lg group">
        {/* Mock background vector contours styled custom dark mode */}
        <div className="absolute inset-0 opacity-25">
          <svg className="w-full h-full text-neutral-700" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,20 Q30,5 50,40 T100,20 L100,100 L0,100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M10,0 Q40,50 60,30 T90,100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
            <path d="M30,0 Q10,70 80,40 T100,50" fill="none" stroke="currentColor" strokeWidth="0.75" />
            {/* Grid */}
            <line x1="20" y1="0" x2="20" y2="100" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1,5" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1,5" />
            <line x1="80" y1="0" x2="80" y2="100" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1,5" />
            <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1,5" />
            <line x1="0" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1,5" />
          </svg>
        </div>

        {/* Geographic Pins Overlays (Reactive) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Map Target Indicator Circle for Selected Zone */}
          <div className="relative flex items-center justify-center">
            {/* Safe zone Geofence pulse */}
            <div className="absolute h-24 w-24 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full animate-ping" />
            <div className="absolute h-16 w-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full" />
            <div className="relative p-2.5 bg-neutral-900 border border-emerald-400 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-bounce">
              <MapPin className="h-6 w-6 fill-emerald-400/25 text-emerald-400 stroke-[2.5px]" />
            </div>
          </div>

          {/* Sibling spots (faint pins around) */}
          {filteredZones.map((z, idx) => {
            if (z.id === selectedZone.id) return null;
            // Place other pins slightly offset
            const offsets = [
              { top: '25%', left: '30%' },
              { bottom: '30%', right: '25%' },
              { top: '40%', right: '35%' }
            ];
            const p = offsets[idx % offsets.length];
            return (
              <div
                key={z.id}
                className="absolute text-neutral-500 flex flex-col items-center"
                style={{ ...p }}
              >
                <MapPin className="h-4 w-4" />
                <span className="text-[7px] font-sans bg-neutral-950/80 px-1 rounded border border-neutral-800 tracking-tight mt-0.5 truncate max-w-[60px]">
                  {z.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Map Header floating elements */}
        <div className="z-10 flex items-center justify-between w-full">
          <div className="bg-neutral-900/90 border border-neutral-800 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-neutral-200 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Zona Militarizada / Municipal Certificada</span>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] text-emerald-300 font-mono">
            Lat: {selectedZone.coordinates.lat.toFixed(4)} Lng: {selectedZone.coordinates.lng.toFixed(4)}
          </div>
        </div>

        {/* Floating location status bar */}
        <div className="z-10 bg-neutral-900/95 border border-neutral-800 backdrop-blur-sm p-3 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 w-full self-end shadow-md">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
              <Navigation className="h-4 w-4 rotate-45 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-neutral-100 truncate">{selectedZone.name}</h4>
              <p className="text-[10px] text-neutral-400 truncate">{selectedZone.address}</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800 w-full sm:w-auto">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedZone.name + ' ' + selectedZone.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow transition-transform active:scale-95 text-center cursor-pointer"
            >
              <span>Google Maps 🗺️</span>
            </a>
            <a
              href={`maps://?q=${encodeURIComponent(selectedZone.name + ' ' + selectedZone.address)}`}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-250 border border-neutral-700 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow transition-transform active:scale-95 text-center cursor-pointer"
            >
              <span>Apple Maps 🍎</span>
            </a>

            <div className="text-right shrink-0">
              <span className="inline-block text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                Activo ✓
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Geofence Alert Warning */}
      <div className="bg-brand-500/5 border border-brand-500/15 rounded-xl p-3 flex gap-2.5 items-start">
        <Shield className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-brand-500 uppercase tracking-wide">Puntos Municipales Libres de Estafas</h4>
          <p className="text-[10px] text-neutral-300 leading-relaxed">
            Por disposición del protocolo <b>FiguMatch® Argentina</b>, no se permite el intercambio comercial monetario ni el reparto en la vía pública desolada. Los chats solo permiten concretar citas en estos hubs seguros monitoreados y con patrulla civil.
          </p>
        </div>
      </div>

      {/* List of Certified Spots */}
      <div className="space-y-2">
        <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase block">
          Puntos Certificados en {selectedCity}:
        </span>
        <div className="grid grid-cols-1 gap-2" id="certified-hubs-list">
          {filteredZones.map((zone) => {
            const isSelected = zone.id === selectedZone.id;
            return (
              <div
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-800 border-emerald-500/50 shadow-md'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
                id={`zone-card-${zone.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className={`h-4 w-4 ${isSelected ? 'text-emerald-400' : 'text-neutral-500'}`} />
                    <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-300' : 'text-neutral-200'}`}>
                      {zone.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 mt-1 italic leading-relaxed">
                  {zone.description}
                </p>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-neutral-800 text-[9px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-emerald-400" /> Presencia Policial Frecuente
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-neutral-400" /> +50 cambios/día
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
