import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, RefreshCw, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { Sticker } from '../types';

interface ScannerMockProps {
  onAddStickersToDuplicates: (stickers: Sticker[]) => void;
}

// Low resource mock samples that users can select to try the AI Scan
const SAMPLE_SHEETS = [
  {
    id: 'sample-1',
    label: 'Lote de Argentina (Messi, Di María)',
    description: 'Boceto de figuritas sueltas de la Albiceleste',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' // Dummy pixel for mock upload
  },
  {
    id: 'sample-2',
    label: 'Mix de Especiales (CC-10, MBappé, Musiala)',
    description: 'Colección de estrellas internacionales',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
];

export default function ScannerMock({ onAddStickersToDuplicates }: ScannerMockProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<Sticker[] | null>(null);
  const [scannedImageName, setScannedImageName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.target?.files?.[0] || e.target.files?.[0];
    if (file) {
      setScannedImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResults(null);
        setAddedCount(null);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleSelect = (sample: typeof SAMPLE_SHEETS[0]) => {
    setScannedImageName(sample.label);
    setSelectedImage(sample.data);
    setResults(null);
    setAddedCount(null);
    setErrorMsg(null);
  };

  const runScan = async () => {
    if (!selectedImage) return;
    setScanning(true);
    setResults(null);
    setErrorMsg(null);
    setAddedCount(null);

    try {
      const response = await fetch('/api/gemini/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/png'
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo establecer conexión con el escáner Gemini.');
      }

      const data = await response.json();
      if (data.success || data.stickers) {
        setResults(data.stickers);
      } else {
        throw new Error(data.error || 'Error desconocido al clasificar con IA.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo conectar al servidor de escaneo.');
    } finally {
      setScanning(false);
    }
  };

  const handleImport = () => {
    if (results && results.length > 0) {
      onAddStickersToDuplicates(results);
      setAddedCount(results.length);
      // reset
      setResults(null);
      setSelectedImage(null);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg space-y-4" id="ai-sticker-scanner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Escáner de Repetidas con IA</h3>
            <p className="text-xs text-neutral-400">Reconoce códigos de figuritas al instante</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-300 font-medium px-2 py-0.5 rounded-full">
          <span>Gemini 3.5 Active</span>
        </div>
      </div>

      <p className="text-xs text-neutral-300">
        Saca una foto a tus figuritas duplicadas o selecciona una imagen de prueba. Nuestra IA Gemini identificará los números del álbum para cargarlos en tu lista automáticamente.
      </p>

      {/* Upload zone */}
      {!selectedImage ? (
        <div className="border border-dashed border-neutral-700 hover:border-emerald-500/50 rounded-xl p-6 bg-neutral-950/60 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="scanner-file-input"
          />
          <div className="p-3 bg-neutral-800 rounded-full text-emerald-400">
            <Camera className="h-6 w-6" />
          </div>
          <div className="text-center space-y-1">
            <span className="text-xs font-medium text-neutral-200 block">Subir foto o usar Cámara</span>
            <span className="text-[10px] text-neutral-400 block">Soporta PNG, JPG y capturas</span>
          </div>
        </div>
      ) : (
        <div className="relative border border-neutral-800 rounded-xl bg-neutral-950 overflow-hidden flex flex-col items-center justify-center p-4">
          <div className="relative w-full aspect-video rounded-lg max-h-48 bg-neutral-900 flex items-center justify-center overflow-hidden border border-neutral-800">
            {scanning && (
              <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite]" />
            )}
            {skuImagePreview(scannedImageName)}
            {scanning && (
              <div className="absolute inset-0 bg-emerald-550/10 flex flex-col items-center justify-center space-y-2 backdrop-blur-xs">
                <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
                <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase animate-pulse">
                  Gemini analizando la foto...
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-stretch gap-2 w-full mt-3">
            <button
              onClick={() => setSelectedImage(null)}
              className="flex-1 py-1 px-3 border border-neutral-700 hover:border-neutral-500 text-neutral-300 text-xs font-medium rounded-lg transition-colors"
              disabled={scanning}
            >
              Cambiar foto
            </button>
            <button
              onClick={runScan}
              className="flex-1 py-1 px-3 bg-emerald-550 hover:bg-emerald-600 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
              disabled={scanning}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Escanear ahora
            </button>
          </div>
        </div>
      )}

      {/* Sample presets for quick testing */}
      {!selectedImage && !results && (
        <div className="space-y-2">
          <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase block">
            ¿No tienes fotos a mano? Intenta con muestras:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_SHEETS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSampleSelect(sample)}
                className="text-left border border-neutral-800 hover:border-emerald-600/30 hover:bg-emerald-900/5 p-2 rounded-lg transition-colors group"
              >
                <div className="text-[11px] font-semibold text-neutral-200 group-hover:text-emerald-300">
                  {sample.label}
                </div>
                <div className="text-[9px] text-neutral-400">{sample.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scan Results */}
      {results && (
        <div className="border border-emerald-550/20 bg-emerald-950/20 p-3.5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
              <Check className="h-4 w-4 stroke-[3px]" />
              ¡IA Reconocimiento Exitoso! ({results.length} figus)
            </span>
            <span className="text-[9px] text-neutral-400 italic">Clic para añadir</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {results.map((fig) => (
              <div key={fig.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-center flex flex-col justify-center">
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded self-center">{fig.id}</span>
                <span className="text-[10px] font-semibold text-neutral-100 truncate mt-1">{fig.name}</span>
                <span className="text-[8px] text-neutral-400 truncate">{fig.team}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            Agregar estas duplicadas a mi Inventario
          </button>
        </div>
      )}

      {/* Success Banner */}
      {addedCount !== null && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center text-xs text-emerald-300 font-semibold shadow-inner">
          ¡Se añadieron {addedCount} figuritas duplicadas en tu inventario! Revisa "Mi Álbum" para verlas.
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="bg-rose-500/15 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error del Escáner:</span> {errorMsg}
          </div>
        </div>
      )}
    </div>
  );
}

function skuImagePreview(imgName: string) {
  // Return a super styled, highly immersive mockup canvas representation of whatever image they uploaded
  const isSample1 = imgName.includes('Argentina');

  return (
    <div className="absolute inset-0 w-full h-full bg-neutral-900 border-2 border-dashed border-emerald-500/30 rounded flex flex-col items-center justify-center p-3 font-mono text-center select-none">
      <div className="p-2 border border-emerald-400 bg-neutral-950/80 rounded-lg mb-2 text-emerald-400">
        <Camera className="h-8 w-8 animate-pulse inline" />
      </div>
      <div className="text-[11px] font-semibold text-neutral-200">
        {imgName}
      </div>
      <div className="text-[8px] text-neutral-500 mt-1 max-w-xs uppercase tracking-widest">
        {isSample1 ? (
          <span>Cargado: 3 figuritas con rostros albicelestes (ARG-10, ARG-11, CC-10)</span>
        ) : (
          <span>Cargado: Figus internacionales y escudo Coca-Cola (FRA-10, GER-10...)</span>
        )}
      </div>
    </div>
  );
}
