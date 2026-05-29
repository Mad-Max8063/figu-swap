"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const genai_1 = require("@google/genai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10mb' }));
// Lazy initializer for Google GenAI to avoid startup crashes if key is initially absent
let aiClient = null;
function getAi() {
    if (!aiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in environment variables.");
        }
        aiClient = new genai_1.GoogleGenAI({
            apiKey: apiKey || "MOCK_KEY_FALLBACK",
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }
    return aiClient;
}
// -------------------------------------------------------------
// Core AI API Endpoints (Migrated from server.ts)
// -------------------------------------------------------------
// 1. Scan Duplicates Image Processor using Gemini Multi-Modal
app.post('/api/gemini/scan', async (req, res) => {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
        return res.status(400).json({ error: 'Falta proveer los datos de la imagen.' });
    }
    try {
        const keyExists = !!process.env.GEMINI_API_KEY;
        if (!keyExists) {
            console.log("Simulating Sticker Scanning since GEMINI_API_KEY is absent");
            await new Promise(resolve => setTimeout(resolve, 2000));
            const mockResults = [
                { id: 'ARG-10', name: 'Lionel Messi ⭐', team: 'Argentina', number: 10 },
                { id: 'ARG-11', name: 'Ángel Di María 🌟', team: 'Argentina', number: 11 },
                { id: 'CC-10', name: 'Leyenda Lionel Messi (CC-10)', team: 'Especiales Coca-Cola', number: 10 },
                { id: 'FRA-10', name: 'Kylian Mbappé ⭐', team: 'Francia', number: 10 },
                { id: 'GER-10', name: 'Jamal Musiala ⭐', team: 'Alemania', number: 10 }
            ];
            const count = Math.floor(Math.random() * 3) + 2;
            const stickers = mockResults.slice(0, count);
            return res.json({ success: true, stickers, mode: 'MOCK_FALLBACK' });
        }
        const ai = getAi();
        const imagePart = {
            inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64.split(',')[1] || imageBase64,
            },
        };
        const textPart = {
            text: `Identify all the World Cup/Copa America style sticker IDs and sticker numbers present in this image or sticker sheet photo. 
      Only search for stickers corresponding to the following codes:
      - Intro/Estadios: FWC-1 to FWC-15
      - Argentina: ARG-1 to ARG-20
      - Brasil: BRA-1 to BRA-20
      - Francia: FRA-1 to FRA-20
      - España: ESP-1 to ESP-20
      - Alemania: GER-1 to GER-20
      - Uruguay: URU-1 to URU-20
      - México: MEX-1 to MEX-20
      - Marruecos: MAR-1 to MAR-20
      - Japón: JPN-1 to JPN-20
      - Coca-Cola: CC-1 to CC-14
      
      Look for text pattern or flags inside the sticker sheets. Extract them as a list of identified codes like "ARG-10", "CC-14", "FRA-7".
      Return a clean list of stickers identified in the specified JSON format.`,
        };
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        success: { type: genai_1.Type.BOOLEAN },
                        stickers: {
                            type: genai_1.Type.ARRAY,
                            description: "Array of detected sticker metadata",
                            items: {
                                type: genai_1.Type.OBJECT,
                                properties: {
                                    id: { type: genai_1.Type.STRING, description: 'Sticker ID like ARG-10' },
                                    team: { type: genai_1.Type.STRING, description: 'Team name like Argentina' },
                                    number: { type: genai_1.Type.NUMBER, description: 'Sticker numeric index' },
                                    name: { type: genai_1.Type.STRING, description: 'Player or sticker name' }
                                },
                                required: ['id', 'team', 'number', 'name']
                            }
                        }
                    },
                    required: ['success', 'stickers']
                }
            }
        });
        const responseText = response.text;
        if (!responseText) {
            return res.status(500).json({ error: 'La respuesta de la IA está vacía.' });
        }
        const output = JSON.parse(responseText.trim());
        return res.json({ ...output, mode: 'REAL_GEMINI' });
    }
    catch (error) {
        console.error('Scan Error:', error);
        res.status(500).json({ error: 'No se pudo analizar la imagen con la IA.', details: error.message });
    }
});
// 1b. Scan Handwritten Planilla Sheet Processor using Gemini Multi-Modal
app.post('/api/gemini/scan-checklist', async (req, res) => {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
        return res.status(400).json({ error: 'Falta proveer los datos de la imagen.' });
    }
    try {
        const keyExists = !!process.env.GEMINI_API_KEY;
        if (!keyExists) {
            console.log("Simulating Checklist Planilla Scanning since GEMINI_API_KEY is absent");
            await new Promise(resolve => setTimeout(resolve, 2500));
            const mockResults = {
                success: true,
                detectedCount: 8,
                stickers: [
                    { id: 'ARG-5', status: 'tengo', confidence: 0.95 },
                    { id: 'ARG-10', status: 'tengo', confidence: 0.99 },
                    { id: 'ARG-11', status: 'repetida', confidence: 0.88 },
                    { id: 'BRA-10', status: 'tengo', confidence: 0.92 },
                    { id: 'BRA-12', status: 'falta', confidence: 0.85 },
                    { id: 'FRA-7', status: 'repetida', confidence: 0.90 },
                    { id: 'GER-10', status: 'tengo', confidence: 0.91 },
                    { id: 'FWC-2', status: 'falta', confidence: 0.82 }
                ],
                notes: "Modo DEMO: Se autodetectaron 8 figuritas en tu planilla de papel. ARG-5, ARG-10, BRA-10, GER-10 marcadas como 'Tengo'; ARG-11, FRA-7 marcadas como 'Repetida'; BRA-12 y FWC-2 marcadas como 'Falta'."
            };
            return res.json({ ...mockResults, mode: 'MOCK_FALLBACK' });
        }
        const ai = getAi();
        const imagePart = {
            inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64.split(',')[1] || imageBase64,
            },
        };
        const textPart = {
            text: `Analyze this photo of a handwritten or printed World Cup sticker checklist sheet ("planilla"). 
      Identify sticker numbers and codes present in the sheet, and determine their status based on handwritten marks, annotations, or list groupings:
      - Common notations include crossed or ticked numbers, circled items, highlighted rows, or list headings like "Tengo", "Mis Figus", or signs like "+" indicator for repeats.
      - If a number is ticked, highlighted, crossed, circled, or labeled as owned/tengo -> status: "tengo".
      - If a number has extra markings (e.g. "+1", "R", "REPE", "REP", "x2", or listed under repeat/double section) -> status: "repetida".
      - If a number is marked under a missing/needs section ("Faltan", "Falta", "F", explicit lacking section) -> status: "falta".
      
      Ensure you output valid country prefixes for our album database:
      - Intro/Estadios: FWC-1 to FWC-[number]
      - Argentina: ARG-1 to ARG-[number]
      - Brasil: BRA-1 to BRA-[number]
      - Francia: FRA-1 to FRA-[number]
      - España: ESP-1 to ESP-[number]
      - Alemania: GER-1 to GER-[number]
      - Uruguay: URU-1 to URU-[number]
      - México: MEX-1 to MEX-[number]
      - Marruecos: MAR-1 to MAR-[number]
      - Japón: JPN-1 to JPN-[number]
      - Coca-Cola: CC-1 to CC-[number]
      
      Return a tidy JSON object mapping each identified sticker code/id to its detected status. Give some brief summary notes explaining what you saw.`,
        };
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        success: { type: genai_1.Type.BOOLEAN },
                        detectedCount: { type: genai_1.Type.INTEGER, description: "Count of all parsed stickers in sheet" },
                        stickers: {
                            type: genai_1.Type.ARRAY,
                            description: "Array of detected stickers with analyzed status",
                            items: {
                                type: genai_1.Type.OBJECT,
                                properties: {
                                    id: { type: genai_1.Type.STRING, description: 'Matched sticker ID like ARG-10' },
                                    status: { type: genai_1.Type.STRING, description: 'Calculated status: tengo, repetida, or falta' },
                                    confidence: { type: genai_1.Type.NUMBER, description: 'Estimated accuracy rating between 0 and 1' },
                                },
                                required: ['id', 'status']
                            }
                        },
                        notes: { type: genai_1.Type.STRING, description: 'Explanation or summary of matching symbols and checklist rules detected' }
                    },
                    required: ['success', 'detectedCount', 'stickers']
                }
            }
        });
        const responseText = response.text;
        if (!responseText) {
            return res.status(500).json({ error: 'La respuesta de la IA está vacía.' });
        }
        const output = JSON.parse(responseText.trim());
        return res.json({ ...output, mode: 'REAL_GEMINI' });
    }
    catch (error) {
        console.error('Checklist Scan Error:', error);
        res.status(500).json({ error: 'No se pudo analizar la planilla con la IA.', details: error.message });
    }
});
// 2. Secure Real-Time Chat Anti-Phishing Monitor
app.post('/api/gemini/filter-chat', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Falta proveer el texto del mensaje.' });
    }
    try {
        const keyExists = !!process.env.GEMINI_API_KEY;
        if (!keyExists) {
            const lower = text.toLowerCase();
            let flagged = false;
            let flaggedReason = '';
            if (lower.includes('.ru') || lower.includes('.cn') || lower.includes('.xyz') || lower.includes('http://') || (lower.includes('.com') && lower.includes('canjear-aqui'))) {
                flagged = true;
                flaggedReason = 'ALERTA: Se detectó un enlace sospechoso u origen raro que podría robar tus credenciales. ¡No abras links!';
            }
            else if (lower.includes('cbu') || lower.includes('cvu') || lower.includes('transferencia') || lower.includes('mercadopago') || lower.includes('adelanto') || lower.includes('plata') || lower.includes('seña') || lower.includes('pagame') || lower.includes('ars$') || lower.includes('pesos')) {
                flagged = true;
                flaggedReason = 'ALERTA DE SEGURIDAD: Nunca pagues por adelantado bajo ningún pretexto. El canje de figuritas es gratuito y en persona en zonas seguras.';
            }
            else if (lower.includes('whatsapp') || lower.includes('wsp') || lower.includes('celular') || lower.includes('ig ') || lower.includes('instagram') || lower.includes('insta') || lower.includes('directo')) {
                flagged = true;
                flaggedReason = 'AVISO: Mantener contacto fuera de la app neutraliza tu protección contra estafas. Insiste en coordinar únicamente en canjes físicos en zonas seguras.';
            }
            return res.json({ flagged, flaggedReason, mode: 'MOCK_FALLBACK' });
        }
        const ai = getAi();
        const systemPrompt = `You are an Argentine cybersecurity intelligence scanner protecting World Cup sticker collectors on our swap platform "FiguSwap Argentina".
    Analyse the incoming chat message to prevent physical scam, digital wallet robbery, advance money payment fraud, or phishing traps.
    Detect and flag (flagged: true) with a Spanish warning alert (flaggedReason) if:
    1. The message requests bank transfer, CVU/CBU exchange, deposit prepayments, digital wallet advances (MercadoPago, Brubank, Western Union etc.), selling the stickers instead of direct swaps, or money upfront ("pagame un adelanto", "te pido seña", "te lo vendo a...").
    2. The message has suspicious domains, unsecure links (especially rare extensions like .ru, .cn, .top, .xyz or unknown shorteners) that may capture user credentials.
    3. The message insistently pressures to take the transaction outside the platform to avoid moderation ("pasame tu WhatsApp", "hablamos por wsp", "pasame tu numero", "escribime por instagram").
    
    If the text is fine, set flagged: false, flaggedReason: "". Keep warning alerts highly impactful, informative, direct, in Argentine-friendly context, reminding users that swaps must be free and physical only inside predetermined SAFE municipal zones.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: text,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        flagged: { type: genai_1.Type.BOOLEAN, description: 'True if message is malicious, suspicious or triggers violation' },
                        flaggedReason: { type: genai_1.Type.STRING, description: 'Warning text warning user to be careful' }
                    },
                    required: ['flagged', 'flaggedReason']
                }
            }
        });
        const responseText = response.text;
        if (!responseText) {
            return res.status(500).json({ error: 'La respuesta de la IA está vacía.' });
        }
        const parsed = JSON.parse(responseText.trim());
        return res.json({ ...parsed, mode: 'REAL_GEMINI' });
    }
    catch (error) {
        console.error('Chat AI Filter Error:', error);
        return res.json({ flagged: false, flaggedReason: '', error: error.message });
    }
});
// Export Express App as a single Cloud Function named 'api'
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map