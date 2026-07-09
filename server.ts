import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ROOT_PORT = 3000;
const app = express();

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google GenAI to avoid startup crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in environment variables. Running in Mock fallbacks mode.");
    }
    aiClient = new GoogleGenAI({
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
// Core AI API Endpoints
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
      // High fidelity mock scanner when no Gemini Key is supplied
      console.log("Simulating Sticker Scanning since GEMINI_API_KEY is absent");
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Return 3-5 random sticker codes
      const mockResults = [
        { id: 'ARG-10', name: 'Lionel Messi ⭐', team: 'Argentina', number: 10 },
        { id: 'ARG-11', name: 'Alexis Mac Allister 🌟', team: 'Argentina', number: 11 },
        { id: 'CC-10', name: 'Leyenda Lionel Messi (CC-10)', team: 'Especiales Coca-Cola', number: 10 },
        { id: 'FRA-10', name: 'Kylian Mbappé ⭐', team: 'Francia', number: 10 },
        { id: 'GER-10', name: 'Jamal Musiala ⭐', team: 'Alemania', number: 10 }
      ];
      // pick 3 random ones
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

CROSS-REFERENCE WITH REAL PANINI WORLD CUP ALBUM ROSTER:
- Use your deep knowledge of the official Panini FIFA World Cup (United 2026) to map any player names, team names, or emblems detected to our specific select database IDs:
  * Argentina: Emiliano Martínez (ARG-2), Nahuel Molina (ARG-3), Cristian Romero (ARG-4), Nicolás Otamendi (ARG-5), Nicolás Tagliafico (ARG-6), Enzo Fernández (ARG-8), Alexis Mac Allister (ARG-9), Rodrigo De Paul (ARG-10), Lionel Messi (ARG-17), Lautaro Martínez (ARG-18), Julián Álvarez (ARG-19).
  * Brasil: Alisson Becker (BRA-2), Marquinhos (BRA-4), Éder Militão (BRA-5), Danilo (BRA-7), Casemiro (BRA-10), Bruno Guimarães (BRA-11), Vinícius Jr (BRA-14), Rodrygo (BRA-15), Raphinha (BRA-19).
  * Francia: Mike Maignan (FRA-2), Théo Hernandez (FRA-3), William Saliba (FRA-4), Jules Koundé (FRA-5), Ibrahima Konaté (FRA-6), Dayot Upamecano (FRA-7), Lucas Digne (FRA-8), Aurélien Tchouaméni (FRA-9), Eduardo Camavinga (FRA-10), Ousmane Dembélé (FRA-15), Bradley Barcola (FRA-16), Kylian Mbappé (FRA-20).
  * España: Unai Simón (ESP-2), Robin Le Normand (ESP-3), Aymeric Laporte (ESP-4), Marc Cucurella (ESP-8), Rodri (ESP-10), Pedri (ESP-11), Lamine Yamal (ESP-15), Dani Olmo (ESP-16), Nico Williams (ESP-17), Álvaro Morata (ESP-19).
  * Alemania: Marc-André ter Stegen (GER-2), Jonathan Tah (GER-3), Antonio Rüdiger (GER-6), Joshua Kimmich (GER-10), Florian Wirtz (GER-11), Jamal Musiala (GER-15), Kai Havertz (GER-17), Leroy Sané (GER-18).
  * Uruguay: Sergio Rochet (URU-2), Ronald Araujo (URU-4), José María Giménez (URU-5), Federico Valverde (URU-10), Giorgian De Arrascaeta (URU-11), Nicolás de la Cruz (URU-15), Darwin Núñez (URU-17).
  * Coca-Cola: Trofeo Copa del Mundo (CC-1), Mascota Oficial (CC-2), Emblema Argentina (CC-3), Emblema Brasil (CC-4), Emblema Francia (CC-5), Leyenda Lionel Messi (CC-10), Estadio Final (CC-14).
- If a player name is recognized in the image, map it to the corresponding code above.
- If a sticker code or player from a non-supported country is detected (e.g. QAT, ECU, SEN, NED, ENG, USA, WAL, KSA, POL, DEN, tun, bel, can, mar, cro, srb, sui, cmr, por, gha, kor), ignore it or map it to supported ones so that the output contains only the supported teams (ARG, BRA, FRA, ESP, GER, URU, MEX, MAR, JPN, FWC, CC).

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
      model: 'gemini-2.0-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            stickers: {
              type: Type.ARRAY,
              description: "Array of detected sticker metadata",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Sticker ID like ARG-10' },
                  team: { type: Type.STRING, description: 'Team name like Argentina' },
                  number: { type: Type.NUMBER, description: 'Sticker numeric index' },
                  name: { type: Type.STRING, description: 'Player or sticker name' }
                },
                required: ['id', 'team', 'number', 'name']
              }
            }
          },
          required: ['success', 'stickers']
        }
      }
    });

    const output = JSON.parse(response.text.trim());
    return res.json({ ...output, mode: 'REAL_GEMINI' });

  } catch (error: any) {
    console.error('Scan Error:', error);
    res.status(500).json({ error: 'No se pudo analizar la imagen con la IA.', details: error.message });
  }
});

// 1b. Scan Handwritten Planilla Sheet Processor using Gemini Multi-Modal
app.post('/api/gemini/scan-checklist', async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Falta proveer los datos del archivo.' });
  }

  try {
    const keyExists = !!process.env.GEMINI_API_KEY;
    if (!keyExists) {
      // Mock scanner fallback for sheets
      console.log("Simulating Checklist Planilla Scanning since GEMINI_API_KEY is absent");
      await new Promise(resolve => setTimeout(resolve, 2500));
      // Return beautiful mock results of stickers detected on the checklist sheet
      const isPdf = mimeType === 'application/pdf';
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
        notes: isPdf 
          ? "Modo DEMO: Se autodetectaron 8 figuritas en tu documento PDF. ARG-5, ARG-10, BRA-10, GER-10 marcadas como 'Tengo'; ARG-11, FRA-7 marcadas como 'Repetida'; BRA-12 y FWC-2 marcadas como 'Falta'."
          : "Modo DEMO: Se autodetectaron 8 figuritas en tu planilla de papel. ARG-5, ARG-10, BRA-10, GER-10 marcadas como 'Tengo'; ARG-11, FRA-7 marcadas como 'Repetida'; BRA-12 y FWC-2 marcadas como 'Falta'."
      };
      return res.json({ ...mockResults, mode: 'MOCK_FALLBACK' });
    }

    const ai = getAi();
    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/png',
        data: imageBase64.split(',')[1] || imageBase64,
      },
    };

    const textPart = {
      text: `Analyze this photo or PDF document of a handwritten or printed World Cup sticker checklist sheet ("planilla"). 
      Identify sticker numbers and codes present in the sheet or document, and determine their status based on handwritten marks, annotations, or list groupings:
      - Common notations include crossed or ticked numbers, circled items, highlighted rows, or list headings like "Tengo", "Mis Figus", or signs like "+" indicator for repeats.
      - If a number is ticked, highlighted, crossed, circled, or labeled as owned/tengo -> status: "tengo".
      - If a number has extra markings (e.g. "+1", "R", "REPE", "REP", "x2", or listed under repeat/double section) -> status: "repetida".
      - If a number is marked under a missing/needs section ("Faltan", "Falta", "F", explicit lacking section) -> status: "falta".

      CROSS-REFERENCE WITH REAL PANINI WORLD CUP ALBUM ROSTER:
      - Use your deep knowledge of the official Panini FIFA World Cup (United 2026) to map any player names, team names, or emblems detected on the sheet to our specific select database IDs:
        * Argentina: Dibu Martínez (ARG-1), Nahuel Molina (ARG-2), Cuti Romero (ARG-3), Otamendi (ARG-4), Tagliafico (ARG-5), Enzo Fernández (ARG-8), Lionel Messi (ARG-10), Alexis Mac Allister (ARG-11), Julián Álvarez (ARG-9), De Paul (ARG-16), Lautaro Martínez (ARG-20).
        * Brasil: Alisson (BRA-1), Neymar Jr (BRA-10), Vinícius Jr (BRA-7), Richarlison (BRA-9), Raphinha (BRA-11), Casemiro (BRA-5).
        * Francia: Maignan (FRA-1), Mbappé (FRA-10), Griezmann (FRA-7), Giroud (FRA-9), Dembélé (FRA-11), Tchouaméni (FRA-8).
        * España: Unai Simón (ESP-1), Dani Olmo (ESP-10), Morata (ESP-9), Gavi (ESP-6), Pedri (ESP-8), Lamine Yamal (ESP-17).
        * Alemania: Manuel Neuer (GER-1), Jamal Musiala (GER-10), Florian Wirtz (GER-17), Füllkrug (GER-9), Kai Havertz (GER-7).
        * Uruguay: Sergio Rochet (URU-1), Darwin Núñez (URU-9), Federico Valverde (URU-15), De Arrascaeta (URU-10).
        * Coca-Cola: World Cup Trophy (CC-1), Mascot (CC-2), Argentina Emblem (CC-3), Brazil Emblem (CC-4), France Emblem (CC-5), Legend Messi (CC-10), Final Stadium (CC-14).
      - If a player name is recognized, map it to the corresponding code above.
      - If a sticker code or player from a non-supported country is detected (e.g. QAT, ECU, SEN, NED, ENG, USA, WAL, KSA, POL, DEN, tun, bel, can, mar, cro, srb, sui, cmr, por, gha, kor), ignore it or map it to supported ones so that the output contains only the supported teams (ARG, BRA, FRA, ESP, GER, URU, MEX, MAR, JPN, FWC, CC).

      Ensure you output valid country prefixes for our album database:
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

      Return a tidy JSON object mapping each identified sticker code/id to its detected status. Give some brief summary notes explaining what you saw.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            detectedCount: { type: Type.INTEGER, description: "Count of all parsed stickers in sheet" },
            stickers: {
              type: Type.ARRAY,
              description: "Array of detected stickers with analyzed status",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Matched sticker ID like ARG-10' },
                  status: { type: Type.STRING, description: 'Calculated status: tengo, repetida, or falta' },
                  confidence: { type: Type.NUMBER, description: 'Estimated accuracy rating between 0 and 1' },
                },
                required: ['id', 'status']
              }
            },
            notes: { type: Type.STRING, description: 'Explanation or summary of matching symbols and checklist rules detected' }
          },
          required: ['success', 'detectedCount', 'stickers']
        }
      }
    });

    const output = JSON.parse(response.text.trim());
    return res.json({ ...output, mode: 'REAL_GEMINI' });

  } catch (error: any) {
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
      // High-integrity offline mock checker
      const lower = text.toLowerCase();
      let flagged = false;
      let flaggedReason = '';

      if (lower.includes('.ru') || lower.includes('.cn') || lower.includes('.xyz') || lower.includes('http://') || (lower.includes('.com') && lower.includes('canjear-aqui'))) {
        flagged = true;
        flaggedReason = 'ALERTA: Se detectó un enlace sospechoso u origen raro que podría robar tus credenciales. ¡No abras links!';
      } else if (lower.includes('cbu') || lower.includes('cvu') || lower.includes('transferencia') || lower.includes('mercadopago') || lower.includes('adelanto') || lower.includes('plata') || lower.includes('seña') || lower.includes('pagame') || lower.includes('ars$') || lower.includes('pesos')) {
        flagged = true;
        flaggedReason = 'ALERTA DE SEGURIDAD: Nunca pagues por adelantado bajo ningún pretexto. El canje de figuritas es gratuito y en persona en zonas seguras.';
      } else if (lower.includes('whatsapp') || lower.includes('wsp') || lower.includes('celular') || lower.includes('ig ') || lower.includes('instagram') || lower.includes('insta') || lower.includes('directo')) {
        flagged = true;
        flaggedReason = 'AVISO: Mantener contacto fuera de la app neutraliza tu protección contra estafas. Insiste en coordinar únicamente en canjes físicos en zonas seguras.';
      }

      return res.json({ flagged, flaggedReason, mode: 'MOCK_FALLBACK' });
    }

    const ai = getAi();
    const systemPrompt = `You are an Argentine cybersecurity intelligence scanner protecting World Cup sticker collectors on our swap platform "FiguScan Argentina".
    Analyse the incoming chat message to prevent physical scam, digital wallet robbery, advance money payment fraud, or phishing traps.
    Detect and flag (flagged: true) with a Spanish warning alert (flaggedReason) if:
    1. The message requests bank transfer, CVU/CBU exchange, deposit prepayments, digital wallet advances (MercadoPago, Brubank, Western Union etc.), selling the stickers instead of direct swaps, or money upfront ("pagame un adelanto", "te pido seña", "te lo vendo a...").
    2. The message has suspicious domains, unsecure links (especially rare extensions like .ru, .cn, .top, .xyz or unknown shorteners) that may capture user credentials.
    3. The message insistently pressures to take the transaction outside the platform to avoid moderation ("pasame tu WhatsApp", "hablamos por wsp", "pasame tu numero", "escribime por instagram").
    
    If the text is fine, set flagged: false, flaggedReason: "". Keep warning alerts highly impactful, informative, direct, in Argentine-friendly context, reminding users that swaps must be free and physical only inside predetermined SAFE municipal zones.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: text,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flagged: { type: Type.BOOLEAN, description: 'True if message is malicious, suspicious or triggers violation' },
            flaggedReason: { type: Type.STRING, description: 'Warning text warning user to be careful' }
          },
          required: ['flagged', 'flaggedReason']
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return res.json({ ...parsed, mode: 'REAL_GEMINI' });

  } catch (error: any) {
    console.error('Chat AI Filter Error:', error);
    // Graceful error fallback
    return res.json({ flagged: false, flaggedReason: '', error: error.message });
  }
});

// -------------------------------------------------------------
// Vite Middleware & Static Serves Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite loaded in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('App configured in Production Static Server serving dist/.');
  }

  app.listen(ROOT_PORT, '0.0.0.0', () => {
    console.log(`FiguScan Argentina listening at http://0.0.0.0:${ROOT_PORT}`);
  });
}

startServer();
