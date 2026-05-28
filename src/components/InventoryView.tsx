import React, { useState } from 'react';
import { TEAMS, ALL_STICKERS } from '../data';
import { CompactStickerState, Sticker, StickerStatus } from '../types';
import { Search, Layers, CheckCircle2, AlertCircle, PlusCircle, Sparkles, SlidersHorizontal, Lock, FileText } from 'lucide-react';
import ScannerMock from './ScannerMock';
import PlanillaScanner from './PlanillaScanner';
import { motion } from 'motion/react';


interface InventoryViewProps {
  stickerStates: Record<string, StickerStatus>;
  onUpdateStickerStatus: (stickerId: string, status: StickerStatus) => void;
  onBulkAddDuplicates: (stickers: Sticker[]) => void;
  onBulkApplyChecklist: (updates: { id: string; status: StickerStatus }[]) => void;
  privateMode?: boolean;
}

export default function InventoryView({ 
  stickerStates, 
  onUpdateStickerStatus, 
  onBulkAddDuplicates, 
  onBulkApplyChecklist,
  privateMode 
}: InventoryViewProps) {
  const [activeTeamId, setActiveTeamId] = useState<string>('ARG'); // Default focus on La Albiceleste!
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showPlanillaScanner, setShowPlanillaScanner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'tengo' | 'falta' | 'repetida'>('all');

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
          <span className="text-neutral-300 uppercase tracking-wider">Mi Álbum FiguSwap</span>
          <span className="text-emerald-400 font-mono">
            {ALL_STICKERS.filter(s => stickerStates[s.id] === 'tengo' || stickerStates[s.id] === 'repetida').length} / {ALL_STICKERS.length} pegadas ({Math.round((ALL_STICKERS.filter(s => stickerStates[s.id] === 'tengo' || stickerStates[s.id] === 'repetida').length / ALL_STICKERS.length) * 100) || 0}%)
          </span>
        </div>
        <div className="h-2.5 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-850">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-700"
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
              return (
                <motion.div
                  key={sticker.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`border rounded-xl p-3 transition-all flex flex-col justify-between space-y-2 bg-gradient-to-br ${getStatusColor(
                    currentStatus
                  )}`}
                  id={`sticker-${sticker.id}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-neutral-950/60 px-1.5 py-0.5 rounded text-neutral-200 border border-neutral-800">
                          {sticker.id}
                        </span>
                        {sticker.isSpecial && (
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 font-bold px-1 rounded animate-pulse">
                            ESPECIAL ⭐
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-neutral-100 truncate mt-1">
                        {sticker.name}
                      </h4>
                      <p className="text-[9px] text-neutral-400 truncate">{sticker.team}</p>
                    </div>

                    {/* Quick status icons indicators */}
                    <div className="shrink-0">
                      {currentStatus === 'tengo' && (
                        <span className="text-emerald-400" title="Tengo"><CheckCircle2 className="h-4.5 w-4.5 fill-emerald-500/10" /></span>
                      )}
                      {currentStatus === 'falta' && (
                        <span className="text-amber-500" title="Me Falta"><AlertCircle className="h-4.5 w-4.5" /></span>
                      )}
                      {currentStatus === 'repetida' && (
                        <span className="text-emerald-300 flex items-center gap-0.5 text-[9px] font-black bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-450 animate-pulse">
                          REPE x2
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="grid grid-cols-3 gap-1 grid-flow-row text-[10px] pt-1.5 border-t border-neutral-800/40">
                    <button
                      onClick={() => onUpdateStickerStatus(sticker.id, currentStatus === 'tengo' ? 'none' : 'tengo')}
                      className={`py-1 rounded-md font-bold transition-all ${
                        currentStatus === 'tengo'
                          ? 'bg-emerald-550 text-neutral-950 shadow-sm'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      Lo Tengo
                    </button>
                    <button
                      onClick={() => onUpdateStickerStatus(sticker.id, currentStatus === 'falta' ? 'none' : 'falta')}
                      className={`py-1 rounded-md font-bold transition-all ${
                        currentStatus === 'falta'
                          ? 'bg-amber-500 text-neutral-950 shadow-sm'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      Falta
                    </button>
                    <button
                      onClick={() => onUpdateStickerStatus(sticker.id, currentStatus === 'repetida' ? 'none' : 'repetida')}
                      className={`py-1 rounded-md font-bold transition-all ${
                        currentStatus === 'repetida'
                          ? 'bg-emerald-400 text-neutral-950 shadow-md transform scale-[1.02]'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-200 border border-emerald-500/10'
                      }`}
                    >
                      Repetida
                    </button>
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
    </div>
  );
}

