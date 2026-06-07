import React, { useState } from 'react';
import { TEAMS, ALL_STICKERS } from '../data';
import { CompactStickerState, Sticker, StickerStatus } from '../types';
import { Search, Layers, CheckCircle2, AlertCircle, PlusCircle, Sparkles, SlidersHorizontal, Lock, FileText, X } from 'lucide-react';
import ScannerMock from './ScannerMock';
import PlanillaScanner from './PlanillaScanner';
import { motion } from 'motion/react';


interface InventoryViewProps {
  stickerStates: Record<string, StickerStatus>;
  duplicateCounts?: Record<string, number>;
  onUpdateStickerStatus: (stickerId: string, status: StickerStatus) => void;
  onUpdateStickerCount?: (stickerId: string, count: number) => void;
  onBulkAddDuplicates: (stickers: Sticker[]) => void;
  onBulkApplyChecklist: (updates: { id: string; status: StickerStatus }[]) => void;
  privateMode?: boolean;
}

export default function InventoryView({ 
  stickerStates, 
  duplicateCounts = {},
  onUpdateStickerStatus, 
  onUpdateStickerCount,
  onBulkAddDuplicates, 
  onBulkApplyChecklist,
  privateMode 
}: InventoryViewProps) {
  const [activeTeamId, setActiveTeamId] = useState<string>('ARG'); // Default focus on La Albiceleste!
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showPlanillaScanner, setShowPlanillaScanner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'tengo' | 'falta' | 'repetida'>('all');
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  // Helper to resolve player position image
  const getStickerImage = (sticker: Sticker) => {
    const generatedStickers = [
      // Argentina (Safe Regenerated)
      'ARG-2', 'ARG-3', 'ARG-4', 'ARG-5', 'ARG-17',
      // Brasil
      'BRA-14',
      // Francia
      'FRA-20',
      // España
      'ESP-15', 'ESP-11',
      // Alemania
      'GER-15', 'GER-11',
      // Uruguay
      'URU-10', 'URU-17',
      // Especiales
      'CC-10', 'FWC-1', 'FWC-2'
    ];
    if (generatedStickers.includes(sticker.id)) {
      return `/stickers/${sticker.id}.png`;
    }

    // Country-specific generic player fallbacks to match flag and jersey colors
    const prefix = sticker.id.split('-')[0];
    const supportedCountries = ['ARG', 'BRA', 'FRA', 'ESP', 'GER', 'URU', 'MEX', 'MAR', 'JPN'];
    if (supportedCountries.includes(prefix)) {
      if (prefix === 'JPN') {
        const positions = ['gk', 'df', 'mf', 'fw'];
        const posKey = positions[sticker.number % 4];
        return `/stickers/generic_${posKey}.png`;
      }
      return `/stickers/generic_${prefix}.png`;
    }

    return '/stickers/generic_player.png';
  };

  // Helper to fetch realistic Panini data
  const getPlayerDetails = (stickerId: string) => {
    const defaults: Record<string, { height: string; weight: string; birth: string; position: string }> = {
      'ARG-1': { height: '1.95 m', weight: '88 kg', birth: '02/09/1992', position: 'Portero Titular' },
      'ARG-2': { height: '1.75 m', weight: '70 kg', birth: '06/04/1998', position: 'Defensor Titular' },
      'ARG-3': { height: '1.85 m', weight: '81 kg', birth: '27/04/1998', position: 'Defensor Titular' },
      'ARG-4': { height: '1.83 m', weight: '81 kg', birth: '12/02/1988', position: 'Defensor Titular' },
      'ARG-5': { height: '1.72 m', weight: '66 kg', birth: '31/08/1992', position: 'Defensor Titular' },
      'ARG-8': { height: '1.78 m', weight: '77 kg', birth: '17/01/2001', position: 'Mediocampista Titular' },
      'ARG-9': { height: '1.70 m', weight: '71 kg', birth: '31/01/2000', position: 'Delantero Titular' },
      'ARG-10': { height: '1.70 m', weight: '72 kg', birth: '24/06/1987', position: 'Delantero Leyenda' },
      'ARG-11': { height: '1.78 m', weight: '70 kg', birth: '24/12/1998', position: 'Mediocampista Estrella' },
      'ARG-16': { height: '1.80 m', weight: '74 kg', birth: '24/05/1994', position: 'Mediocampista Titular' },
      'ARG-20': { height: '1.74 m', weight: '72 kg', birth: '22/08/1997', position: 'Delantero Titular' }
    };
    return defaults[stickerId] || { height: '1.80 m', weight: '75 kg', birth: '15/05/1999', position: 'Jugador Oficial' };
  };

  // Flag mapper
  const getCountryFlag = (team: string) => {
    const flags: Record<string, string> = {
      'Argentina': '🇦🇷',
      'Brasil': '🇧🇷',
      'Francia': '🇫🇷',
      'España': '🇪🇸',
      'Alemania': '🇩🇪',
      'Uruguay': '🇺🇾',
      'México': '🇲🇽',
      'Marruecos': '🇲🇦',
      'Japón': '🇯🇵',
      'Especiales Coca-Cola': '🥤',
      'Intro & Estadios': '🏆'
    };
    return flags[team] || '🏳️';
  };

  // Filter stickers based on active country tab OR search query
  const filteredStickers = ALL_STICKERS.filter((sticker) => {
    const status = stickerStates[sticker.id] || 'none';
    
    // Status Filter Check
    if (statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }

    // Search Query Check (overrides tab filter if active)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = sticker.name.toLowerCase().includes(q);
      const matchTeam = sticker.team.toLowerCase().includes(q);
      const matchId = sticker.id.toLowerCase().includes(q);
      const matchNum = sticker.number.toString() === q;
      return matchName || matchTeam || matchId || matchNum;
    }

    // Default: Filter by selected Team Tab
    const teamPrefix = TEAMS.find((t) => t.id === activeTeamId)?.prefix;
    return sticker.id.startsWith(`${teamPrefix}-`);
  });

  const getStatusColor = (status: StickerStatus) => {
    switch (status) {
      case 'tengo':
        return 'bg-neutral-800 border-emerald-500/40 text-emerald-300 shadow-[inset_0_0_8px_rgba(16,185,129,0.06)]';
      case 'falta':
        return 'bg-neutral-800 border-amber-500/40 text-amber-200 shadow-[inset_0_0_8px_rgba(245,158,11,0.06)]';
      case 'repetida':
        return 'bg-emerald-950/40 border-emerald-400 text-emerald-400 font-bold shadow-[0_0_10px_rgba(52,211,153,0.15)]';
      default:
        return 'bg-neutral-900 border-neutral-805 text-neutral-400 hover:border-neutral-700';
    }
  };

  return (
    <div className="space-y-4" id="album-inventory-dashboard">
      {/* Private Mode Active Banner */}
      {privateMode && (
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-900 border border-amber-500/20 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/25 shrink-0 flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">Modo Control Personal Activo</span>
              <p className="text-[10px] text-neutral-400 leading-snug mt-0.5">
                Estás controlando tus figuritas de forma privada. Se suspendieron las sugerencias y chats para que gestiones tu progreso a tu propio ritmo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Toggle Block */}
      {showScanner ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Escáner de Repetidas</span>
            <button
              onClick={() => setShowScanner(false)}
              className="text-xs font-bold text-rose-450 hover:text-rose-400 bg-neutral-950/60 px-2.5 py-1 rounded-lg border border-neutral-850"
            >
              Cerrar Escáner
            </button>
          </div>
          <ScannerMock
            onAddStickersToDuplicates={(stickers) => {
              onBulkAddDuplicates(stickers);
              setShowScanner(false);
            }}
          />
        </div>
      ) : showPlanillaScanner ? (
        <div className="space-y-2">
          <PlanillaScanner
            onApplyChecklist={(updates) => {
              onBulkApplyChecklist(updates);
              setShowPlanillaScanner(false);
            }}
            onClose={() => setShowPlanillaScanner(false)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="scanners-hub-container">
          <button
            onClick={() => {
              setShowScanner(true);
              setShowPlanillaScanner(false);
            }}
            className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-950/5 active:scale-[0.98] text-neutral-300 p-2.5 rounded-xl transition-all flex items-center gap-3 text-left relative overflow-hidden group shadow-md"
            id="trigger-scanner-btn"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-neutral-100 block group-hover:text-emerald-300 transition-colors">Escanear Lote con Foto</span>
              <p className="text-[10px] text-neutral-400 leading-snug truncate">Capturá multiples figuritas duplicadas juntas</p>
            </div>
          </button>

          <button
            onClick={() => {
              setShowPlanillaScanner(true);
              setShowScanner(false);
            }}
            className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:bg-amber-950/5 active:scale-[0.98] text-neutral-300 p-2.5 rounded-xl transition-all flex items-center gap-3 text-left relative overflow-hidden group shadow-md"
            id="trigger-planilla-scanner-btn"
          >
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5 text-amber-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-neutral-100 block group-hover:text-amber-300 transition-colors">Importar Planilla de Papel (IA)</span>
              <p className="text-[10px] text-neutral-400 leading-snug truncate">Subí tus anotaciones a mano. La IA rellena el álbum</p>
            </div>
          </button>
        </div>
      )}

      {/* Real-time Global Progress Bar */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-neutral-300 uppercase tracking-wider">Mi Álbum FiguScan</span>
          <span className="text-brand-500 font-mono">
            {ALL_STICKERS.filter(s => stickerStates[s.id] === 'tengo' || stickerStates[s.id] === 'repetida').length} / {ALL_STICKERS.length} pegadas ({Math.round((ALL_STICKERS.filter(s => stickerStates[s.id] === 'tengo' || stickerStates[s.id] === 'repetida').length / ALL_STICKERS.length) * 100) || 0}%)
          </span>
        </div>
        <div className="h-2.5 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-850">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-700"
            style={{ width: `${Math.round((ALL_STICKERS.filter(s => stickerStates[s.id] === 'tengo' || stickerStates[s.id] === 'repetida').length / ALL_STICKERS.length) * 100) || 0}%` }}
          />
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-3 shadow-md">
        <div className="relative flex items-center bg-neutral-950 border border-neutral-800 focus-within:border-emerald-500/60 rounded-lg overflow-hidden px-3">
          <Search className="h-4.5 w-4.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por jugador, país o número (Ej: Messi, ARG-10)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-xs text-neutral-200 py-2 ml-2"
            id="stickers-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-neutral-500 hover:text-neutral-350 font-bold uppercase"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Triple Status Filter */}
        <div className="flex items-center justify-between gap-1.5 border-t border-neutral-850 pt-2 text-[11px]">
          <span className="text-neutral-500 font-bold uppercase tracking-wider hidden sm:inline">Listar:</span>
          <div className="grid grid-cols-4 gap-1 w-full sm:w-auto">
            {([
              { id: 'all', label: 'Todos' },
              { id: 'tengo', label: 'Pegados' },
              { id: 'falta', label: 'Faltan' },
              { id: 'repetida', label: 'Repes' }
            ] as const).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`py-1.5 px-2.5 rounded-md font-semibold text-center transition-colors ${
                  statusFilter === filter.id
                    ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Country Navigation Tabs Grid (Visible only if no search query is active) */}
      {!searchQuery && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase block">
            Secciones del Álbum:
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 mask-right" id="team-scroll-tab">
            {TEAMS.map((team) => {
              const teamStickers = ALL_STICKERS.filter(s => s.id.startsWith(`${team.prefix}-`));
              const teamOwned = teamStickers.filter(s => stickerStates[s.id] === 'tengo' || stickerStates[s.id] === 'repetida').length;
              const teamPercent = Math.round((teamOwned / team.size) * 100) || 0;
              return (
                <button
                  key={team.id}
                  onClick={() => setActiveTeamId(team.id)}
                  className={`flex-none px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTeamId === team.id
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>{team.name}</span>
                  {/* Circular progress SVG */}
                  <div className="relative flex items-center justify-center h-5 w-5 shrink-0">
                    <svg className="w-5 h-5 -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke={activeTeamId === team.id ? "rgba(10,10,10,0.15)" : "#262626"}
                        strokeWidth="2"
                        fill="transparent"
                      />
                      {/* Active stroke */}
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke={activeTeamId === team.id ? "#0a0a0a" : "#10b981"}
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 8}
                        strokeDashoffset={2 * Math.PI * 8 * (1 - teamPercent / 100)}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className={`absolute text-[7px] font-bold font-mono ${
                      activeTeamId === team.id ? 'text-neutral-950' : 'text-neutral-200'
                    }`}>
                      {teamPercent}
                    </span>
                  </div>

                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stickers grid layout */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">
            {searchQuery ? `Resultados de Búsqueda (${filteredStickers.length})` : 'Figuritas en esta sección:'}
          </span>
          <span className="text-[9px] text-neutral-400">Total: 994 canjeables</span>
        </div>
{filteredStickers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="stickers-cards-grid">
            {filteredStickers.map((sticker) => {
              const currentStatus = stickerStates[sticker.id] || 'none';
              const isUnlocked = currentStatus === 'tengo' || currentStatus === 'repetida';
              
              return (
                <motion.div
                  key={sticker.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`border rounded-xl p-3 transition-all flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    isUnlocked
                      ? getStatusColor(currentStatus)
                      : 'bg-neutral-950/50 border-dashed border-neutral-800/80 hover:border-neutral-700 text-neutral-500'
                  }`}
                  id={`sticker-${sticker.id}`}
                >
                  {/* Subtle empty slot watermark when locked */}
                  {!isUnlocked && (
                    <div className="absolute right-3 top-3 opacity-[0.03] select-none pointer-events-none font-black text-6xl">
                      {sticker.number}
                    </div>
                  )}

                  <div 
                    className="flex items-start justify-between gap-2 cursor-pointer hover:opacity-90 flex-1 z-10"
                    onClick={() => setSelectedSticker(sticker)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          isUnlocked 
                            ? 'bg-neutral-950/60 text-neutral-200 border-neutral-800' 
                            : 'bg-neutral-900/60 text-neutral-500 border-neutral-850'
                        }`}>
                          {sticker.id}
                        </span>
                        {sticker.isSpecial && (
                          <span className={`text-[8px] font-bold px-1 rounded ${
                            isUnlocked 
                              ? 'bg-amber-500/20 text-amber-300 animate-pulse' 
                              : 'bg-neutral-900 text-neutral-600'
                          }`}>
                            {isUnlocked ? 'ESPECIAL ⭐' : 'ESPECIAL'}
                          </span>
                        )}
                        {isUnlocked ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1 rounded">
                            ¡PEGADA! 🏆
                          </span>
                        ) : (
                          <span className="text-[8px] text-neutral-650 font-medium">
                            VACÍO 🔲
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs font-bold mt-1.5 truncate ${isUnlocked ? 'text-neutral-100' : 'text-neutral-500'}`}>
                        {sticker.name}
                      </h4>
                      <p className="text-[9px] text-neutral-500 truncate">{sticker.team}</p>
                    </div>

                    {/* Unlocked sticker thumbnail preview OR generic silhouette placeholder */}
                    <div className="shrink-0 relative">
                      {isUnlocked ? (
                        <div className="w-11 h-14 rounded-md border border-neutral-700 bg-neutral-950 overflow-hidden relative shadow-sm hover:scale-105 transition-transform">
                          <img 
                            src={getStickerImage(sticker)} 
                            alt={sticker.name}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => { e.currentTarget.src = '/stickers/generic_player.png'; }}
                          />
                          {/* Foil glow effect inside grid */}
                          {sticker.isSpecial && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-white/20 animate-pulse pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        <div className="w-11 h-14 rounded-md border border-neutral-900 bg-neutral-900/40 flex items-center justify-center text-neutral-700 font-black text-xs shadow-inner">
                          ?
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="grid grid-cols-3 gap-1 grid-flow-row text-[10px] pt-1.5 border-t border-neutral-800/20 z-10">
                    <button
                      onClick={() => onUpdateStickerStatus(sticker.id, currentStatus === 'tengo' ? 'none' : 'tengo')}
                      className={`py-1 rounded-md font-bold transition-all ${
                        currentStatus === 'tengo'
                          ? 'bg-emerald-550 text-neutral-950 shadow-sm'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      Lo Tengo
                    </button>
                    <button
                      onClick={() => onUpdateStickerStatus(sticker.id, currentStatus === 'falta' ? 'none' : 'falta')}
                      className={`py-1 rounded-md font-bold transition-all ${
                        currentStatus === 'falta'
                          ? 'bg-amber-500 text-neutral-950 shadow-sm'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      Falta
                    </button>
                    {currentStatus === 'repetida' ? (
                      <div className="flex items-center justify-between bg-emerald-400 text-neutral-950 rounded-md font-bold shadow-md transform scale-[1.02] overflow-hidden py-0.5 px-1.5 h-[22px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentCount = duplicateCounts[sticker.id] || 1;
                            if (currentCount > 1) {
                              onUpdateStickerCount?.(sticker.id, currentCount - 1);
                            } else {
                              onUpdateStickerStatus(sticker.id, 'tengo');
                            }
                          }}
                          className="hover:bg-emerald-500/35 px-1 rounded text-neutral-950 font-black cursor-pointer text-xs select-none"
                        >
                          -
                        </button>
                        <span className="text-[10px] tracking-tight font-black select-none">
                          {duplicateCounts[sticker.id] || 1} Rep
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentCount = duplicateCounts[sticker.id] || 1;
                            onUpdateStickerCount?.(sticker.id, currentCount + 1);
                          }}
                          className="hover:bg-emerald-500/35 px-1 rounded text-neutral-950 font-black cursor-pointer text-xs select-none"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onUpdateStickerStatus(sticker.id, 'repetida')}
                        className="py-1 rounded-md font-bold bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-emerald-500/10 transition-all"
                      >
                        Repetida
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center space-y-2">
            <span className="text-neutral-500 font-mono text-xl block">∅</span>
            <p className="text-xs text-neutral-400">No se encontraron figuritas con ese filtro en esta sección.</p>
          </div>
        )}
      </div>

      {/* High-Fidelity 3D Holographic Anime Sticker Modal */}
      {selectedSticker && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full relative shadow-2xl flex flex-col items-center"
          >
            <button 
              onClick={() => setSelectedSticker(null)}
              className="absolute top-4 right-4 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 p-1.5 rounded-full border border-neutral-800 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title Section */}
            <div className="text-center w-full mb-4">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="h-4 w-4 text-amber-400 animate-spin-slow" />
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black">Figurita Coleccionable Animé</span>
              </div>
              <h3 className="text-base font-bold text-neutral-100 mt-0.5">{selectedSticker.name}</h3>
              <p className="text-xs text-neutral-400 flex items-center justify-center gap-1">
                <span>{getCountryFlag(selectedSticker.team)}</span>
                <span>{selectedSticker.team}</span>
              </p>
            </div>

            {/* Panini-style Shiny Holographic Sticker card */}
            <div 
              onMouseMove={(e) => {
                const card = e.currentTarget;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const px = (x / rect.width) * 100;
                const py = (y / rect.height) * 100;
                card.style.setProperty('--x', `${px}%`);
                card.style.setProperty('--y', `${py}%`);
                
                // Tilt effect
                const rx = -(y - rect.height / 2) / (rect.height / 2) * 8;
                const ry = (x - rect.width / 2) / (rect.width / 2) * 8;
                card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget;
                card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)';
                card.style.setProperty('--x', '50%');
                card.style.setProperty('--y', '50%');
              }}
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out',
                position: 'relative'
              }}
              className="w-64 h-96 rounded-2xl bg-neutral-950 border-2 border-neutral-700 shadow-xl overflow-hidden flex flex-col p-3.5 space-y-3 cursor-pointer group"
            >
              {/* Premium Shiny overlay */}
              <div 
                className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  backgroundImage: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(255, 255, 255, 0.22) 0%, rgba(255, 180, 0, 0.05) 40%, transparent 70%)`
                }}
              />

              {/* Sticker Header Layout */}
              <div className="flex items-center justify-between z-20">
                <span className="text-[10px] font-black font-mono bg-neutral-900/90 text-neutral-200 px-2 py-0.5 rounded border border-neutral-800">
                  {selectedSticker.id}
                </span>
                <span className="text-[14px]">
                  {getCountryFlag(selectedSticker.team)}
                </span>
              </div>

              {/* Character Anime Illustration frame */}
              <div className="flex-1 rounded-xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800/80 overflow-hidden relative flex items-center justify-center">
                <img 
                  src={getStickerImage(selectedSticker)} 
                  alt={selectedSticker.name}
                  className="w-full h-full object-cover object-center scale-[1.01]"
                  onError={(e) => {
                    // Fallback to position icon if load fails
                    e.currentTarget.src = '/stickers/generic_player.png';
                  }}
                />

                {/* Foil Sparkle indicators */}
                {selectedSticker.isSpecial && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-neutral-950 p-1 rounded-full border border-neutral-750 shadow-md">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Player Metadata (Panini Style) */}
              <div className="bg-neutral-900/95 border border-neutral-800 rounded-xl p-2.5 space-y-1.5 z-20">
                <div className="flex justify-between text-[9px] text-neutral-400 font-medium">
                  <span>Pos: <strong className="text-neutral-200">{getPlayerDetails(selectedSticker.id).position}</strong></span>
                  <span>Nacimiento: <strong className="text-neutral-200">{getPlayerDetails(selectedSticker.id).birth}</strong></span>
                </div>
                <div className="h-px bg-neutral-800" />
                <div className="flex justify-between text-[9px] text-neutral-400 font-medium">
                  <span>Altura: <strong className="text-neutral-200">{getPlayerDetails(selectedSticker.id).height}</strong></span>
                  <span>Peso: <strong className="text-neutral-200">{getPlayerDetails(selectedSticker.id).weight}</strong></span>
                </div>
              </div>
            </div>

            {/* Sticker Status Indicator inside popup */}
            <div className="mt-4 text-center">
              <span className="text-[9px] text-neutral-500 uppercase tracking-widest block mb-2">Estado actual</span>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${
                  stickerStates[selectedSticker.id] === 'tengo' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  stickerStates[selectedSticker.id] === 'falta' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  stickerStates[selectedSticker.id] === 'repetida' ? 'bg-emerald-400/20 text-emerald-450 border-emerald-400/40 animate-pulse' :
                  'bg-neutral-950 text-neutral-500 border-neutral-850'
                }`}>
                  {stickerStates[selectedSticker.id] === 'tengo' ? 'Lo tengo' :
                   stickerStates[selectedSticker.id] === 'falta' ? 'Falta' :
                   stickerStates[selectedSticker.id] === 'repetida' ? 'Repetida' :
                   'No seleccionado'}
                </span>
                {stickerStates[selectedSticker.id] === 'repetida' && (
                  <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-full py-1 px-2.5 shadow-inner">
                    <button
                      onClick={() => {
                        const currentCount = duplicateCounts[selectedSticker.id] || 1;
                        if (currentCount > 1) {
                          onUpdateStickerCount?.(selectedSticker.id, currentCount - 1);
                        } else {
                          onUpdateStickerStatus(selectedSticker.id, 'tengo');
                        }
                      }}
                      className="text-xs text-neutral-400 hover:text-white px-1.5 font-bold cursor-pointer select-none"
                    >
                      -
                    </button>
                    <span className="text-[11px] text-emerald-300 font-mono font-black px-1.5 min-w-[32px] text-center">
                      x{duplicateCounts[selectedSticker.id] || 1}
                    </span>
                    <button
                      onClick={() => {
                        const currentCount = duplicateCounts[selectedSticker.id] || 1;
                        onUpdateStickerCount?.(selectedSticker.id, currentCount + 1);
                      }}
                      className="text-xs text-neutral-400 hover:text-white px-1.5 font-bold cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

