import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, RefreshCw, Check, AlertTriangle, AlertCircle, Trash2, HelpCircle } from 'lucide-react';
import { Sticker, StickerStatus } from '../types';
import { ALL_STICKERS } from '../data';

interface PlanillaScannerProps {
  onApplyChecklist: (updates: { id: string; status: StickerStatus }[]) => void;
  onClose: () => void;
}

// Pre-defined high fidelity sample sheets for rapid testing
const SAMPLE_PLANILLAS = [
  {
    id: 'sheet-1',
    label: '📋 Planilla Borrador Escolar',
    description: 'Borrador rápido: tildados las de Argentina (ARG-5, ARG-10), repes marcadas con "+" (ARG-11) y faltantes con "F"',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  },
  {
    id: 'sheet-2',
    label: '📝 Cuaderno de Cómputo Mundial',
    description: 'Planilla impresa donde anotaron BRA-10, GER-10 como tildadas y FRA-7, ARG-11 marcadas como "REPETIDA"',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
];

export default function PlanillaScanner({ onApplyChecklist, onClose }: PlanillaScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedStickers, setDetectedStickers] = useState<{ id: string; status: StickerStatus; confidence: number }[] | null>(null);
  const [iaNotes, setIaNotes] = useState<string>('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDetectedStickers(null);
        setErrorMsg(null);
        setSuccessCount(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_PLANILLAS[0]) => {
    setImageName(sample.label);
    setSelectedImage(sample.data);
    setDetectedStickers(null);
    setErrorMsg(null);
    setSuccessCount(null);
  };

  const executeScanners = async () => {
    if (!selectedImage) return;
    setScanning(true);
    setErrorMsg(null);
    setDetectedStickers(null);
    setSuccessCount(null);

    try {
      const response = await fetch('/api/gemini/scan-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/png'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error uploading custom checksheet.');
      }

      const data = await response.json();
      if (data.success && data.stickers) {
        // Filter out detected codes that are not in our standard database to avoid any database corruption
        const validStickers = data.stickers.filter((item: any) => 
          ALL_STICKERS.some(s => s.id === item.id) && ['tengo', 'repetida', 'falta', 'none'].includes(item.status)
        );
        setDetectedStickers(validStickers);
        setIaNotes(data.notes || "Se reconoció exitosamente la estructura de marcas manuales.");
      } else {
        throw new Error(data.error || 'No se han reconocido códigos de figuritas legibles.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión al analizar la planilla en papel.');
    } finally {
      setScanning(false);
    }
  };

  // Allow the user to manually change parsed status for a sticker to fix any OCR errors
  const handleToggleStatus = (index: number, newStatus: StickerStatus) => {
    if (!detectedStickers) return;
    const updated = [...detectedStickers];
    updated[index] = { ...updated[index], status: newStatus };
    setDetectedStickers(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (!detectedStickers) return;
    setDetectedStickers(detectedStickers.filter((_, i) => i !== index));
  };

  const handleImportChecklist = () => {
    if (!detectedStickers || detectedStickers.length === 0) return;
    onApplyChecklist(detectedStickers);
    setSuccessCount(detectedStickers.length);
    setDetectedStickers(null);
    setSelectedImage(null);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-4" id="ai-planilla-checklist-scanner">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
            <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-150">Importador de Planillas de Papel (IA)</h3>
            <p className="text-[11px] text-neutral-400">Pasa tus anotaciones a mano al álbum digital</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold text-neutral-500 hover:text-neutral-350 bg-neutral-950/60 px-2.5 py-1 rounded-lg border border-neutral-850"
        >
          Cerrar
        </button>
      </div>

      <p className="text-xs text-neutral-300 leading-relaxed">
        ¿Viniste completando una planilla impresa o una hoja de cuaderno a mano? <strong>No lo pases uno por uno.</strong> Saca una foto a tu hoja y nuestra IA identificará qué figuritas tenés, repes y faltantes para autocompletar tu cuenta al instante.
      </p>

      {/* Upload trigger zone */}
      {!selectedImage ? (
        <div className="border border-dashed border-neutral-700 hover:border-amber-500/40 rounded-xl p-6 bg-neutral-950/50 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="planilla-file-input"
          />
          <div className="p-3 bg-neutral-850 rounded-full text-amber-400 border border-neutral-750">
            <Camera className="h-6 w-6" />
          </div>
          <div className="text-center space-y-1">
            <span className="text-xs font-medium text-neutral-200 block">Subir foto de tu checklist / planilla</span>
            <span className="text-[10px] text-neutral-400 block">Identifica anotaciones como ARG-10, tildes y cruces</span>
          </div>
        </div>
      ) : (
        <div className="relative border border-neutral-850 rounded-xl bg-neutral-950 p-4 focus-within:border-amber-500/30">
          <div className="relative w-full aspect-video rounded-lg max-h-40 bg-neutral-900 flex items-center justify-center overflow-hidden border border-neutral-800">
            {scanning && (
              <div className="absolute inset-x-0 top-0 h-1 bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-[bounce_2s_infinite]" />
            )}
            
            <div className="absolute inset-0 w-full h-full bg-neutral-900 flex flex-col items-center justify-center p-3 font-mono text-center select-none">
              <Camera className="h-8 w-8 text-amber-500 animate-pulse mb-1" />
              <div className="text-xs font-semibold text-neutral-200">{imageName}</div>
              <p className="text-[9px] text-neutral-500 mt-1 max-w-xs uppercase">
                {imageName.includes('Borrador') 
                  ? 'Listo para buscar marcas de lápiz en planilla borrador' 
                  : 'Listo para interpretar grilla y anotaciones escritas'}
              </p>
            </div>

            {scanning && (
              <div className="absolute inset-0 bg-amber-950/40 flex flex-col items-center justify-center space-y-2 backdrop-blur-xs">
                <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
                <span className="text-xs font-bold text-amber-300 tracking-wider uppercase animate-pulse">
                  Gemini interpretando caligrafía...
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full mt-3">
            <button
              onClick={() => setSelectedImage(null)}
              className="flex-1 py-1.5 border border-neutral-700 hover:border-neutral-500 text-neutral-300 text-xs font-medium rounded-lg transition-colors"
              disabled={scanning}
            >
              Cambiar foto / Volver
            </button>
            <button
              onClick={executeScanners}
              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-neutral-950 text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
              disabled={scanning}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Escanear caligrafía
            </button>
          </div>
        </div>
      )}

      {/* Sample preset options */}
      {!selectedImage && !detectedStickers && (
        <div className="space-y-2 pt-1 border-t border-neutral-850/60">
          <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase block flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-neutral-500" /> Préstamos de prueba listos para ensayar la IA:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_PLANILLAS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className="text-left border border-neutral-800/80 hover:border-amber-600/30 hover:bg-amber-900/5 p-2.5 rounded-xl transition-all group"
              >
                <div className="text-[11px] font-bold text-neutral-200 group-hover:text-amber-400 transition-colors">
                  {sample.label}
                </div>
                <div className="text-[9px] text-neutral-400 mt-1 line-clamp-2 leading-snug">
                  {sample.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parsing results review panel */}
      {detectedStickers && (
        <div className="border border-amber-500/20 bg-neutral-950/40 p-3 rounded-xl space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Check className="h-4 w-4 stroke-[3px]" />
              ¡Escaneado Exitoso! ({detectedStickers.length} figus reconocidas)
            </span>
            <p className="text-[10px] text-neutral-400 italic leading-snug">
              ℹ️ {iaNotes}
            </p>
            <p className="text-[10px] text-amber-300 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg mt-1.5 leading-snug">
              📝 <strong>¡Revisá las marcas detectadas!</strong> Si la IA malinterpretó alguna marca o número, podés cambiar el estado tocando los botones abajo de cada figu antes de guardarla.
            </p>
          </div>

          {/* List scroll preview */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1" id="scanned-results-container">
            {detectedStickers.map((item, index) => {
              const fullDetails = ALL_STICKERS.find(s => s.id === item.id);
              if (!fullDetails) return null;

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs relative group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-mono font-bold bg-neutral-950 border border-neutral-800 px-1.5 py-0.5 rounded text-amber-400 shrink-0">
                      {item.id}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-neutral-200 block truncate">{fullDetails.name}</span>
                      <span className="text-[9px] text-neutral-400">{fullDetails.team}</span>
                    </div>
                  </div>

                  {/* Manual fine-tuning triggers */}
                  <div className="flex items-center justify-between gap-1.5 shrink-0 select-none">
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <button
                        onClick={() => handleToggleStatus(index, 'tengo')}
                        className={`py-1 px-2.5 rounded font-bold transition-all ${
                          item.status === 'tengo'
                            ? 'bg-emerald-500 text-neutral-950 font-black'
                            : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        Tengo
                      </button>
                      <button
                        onClick={() => handleToggleStatus(index, 'repetida')}
                        className={`py-1 px-2.5 rounded font-bold transition-all ${
                          item.status === 'repetida'
                            ? 'bg-emerald-400 text-neutral-950 font-black'
                            : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        Repe
                      </button>
                      <button
                        onClick={() => handleToggleStatus(index, 'falta')}
                        className={`py-1 px-2.5 rounded font-bold transition-all ${
                          item.status === 'falta'
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        Falta
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-850"
                      title="Descartar de esta importación"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-850 flex gap-2">
            <button
              onClick={() => setDetectedStickers(null)}
              className="px-3 py-2 border border-neutral-750 hover:bg-neutral-850 text-neutral-350 font-semibold text-xs rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleImportChecklist}
              className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black text-xs rounded-lg shadow-md transition-all text-center uppercase tracking-wider"
            >
              Autocompletar mi Álbum ({detectedStickers.length} figus)
            </button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {successCount !== null && (
        <div className="bg-emerald-550/15 border border-emerald-550/20 p-3.5 rounded-xl text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Check className="h-4.5 w-4.5 stroke-[3px]" />
            ¡Álbum Autocompletado!
          </div>
          <p className="text-[11px] text-neutral-350">
            Se registraron con éxito las <strong>{successCount} figuritas</strong> que tenías cargadas a mano en tu planilla física. ¡Mirá el álbum actualizado!
          </p>
        </div>
      )}

      {/* Error report */}
      {errorMsg && (
        <div className="bg-rose-500/15 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wide text-[10px] text-rose-450 mb-0.5">Fallo de importación</span>
            {errorMsg}
          </div>
        </div>
      )}
    </div>
  );
}
