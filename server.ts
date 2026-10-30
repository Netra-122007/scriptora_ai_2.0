import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "20mb" }));

// Helper for lazy AI client initialization
function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API key environment variable is not configured in Secrets panel.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiConfigured: !!process.env.GEMINI_API_KEY });
});

// AI Air Writing Recognition (Characters, Words, Math, Diagrams, Signatures, Gestures)
app.post("/api/ai/recognize", async (req, res) => {
  try {
    const { imageBase64, strokeData, mode, previousText, language } = req.body;
    const ai = getAiClient();

    let systemPrompt = mode === "text"
      ? "Recognize only the single uppercase English letter or digit clearly drawn in the supplied stroke image. The input is a completed air-writing trajectory, not a request to predict text. Never infer a word or sentence. If the drawing is unclear or does not form one character, return an empty recognizedText and confidence below 75."
      : "You are SCRIPTORA AI, a multimodal assistant analyzing user-provided air-writing strokes.";
    if (mode === "text") {
      systemPrompt += " Return exactly one character in recognizedText, for example S. Do not return punctuation, words, explanations, or autocomplete.";
    } else if (mode === "math") {
      systemPrompt += " The user drew a mathematical equation or formula in the air. Recognize the equation, transcribe it cleanly in LaTeX or plain math notation, solve it step-by-step, and state the final answer clearly.";
    } else if (mode === "diagram") {
      systemPrompt += " The user drew a flowchart, geometric shape, or conceptual diagram in the air. Identify the shapes, connections, and labels, and provide a clean text explanation and ASCII/Markdown representation of the diagram.";
    } else if (mode === "signature") {
      systemPrompt += " The user wrote their signature or a cursive verification pattern in the air. Analyze the stroke flow, symmetry, complexity, and provide a biometric signature verification score (0-100%) with confidence analysis.";
    } else if (mode === "gesture") {
      systemPrompt += " The user performed a spatial air command gesture (like swipe, circle, checkmark, cross, arrow, triangle). Identify the exact gesture name, intended command (e.g., 'Delete', 'Next', 'Approve', 'Undo'), and confidence.";
    }

    const contents: any[] = [];
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = match ? match[1] : "image/png";
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const promptText = mode === "text"
      ? `Classify the single completed character in this air-writing image. Return only that one uppercase letter or digit. If it is ambiguous, return an empty recognizedText and confidence below 75. Stroke sample: ${strokeData ? JSON.stringify(strokeData).slice(0, 1600) : "see image"}.`
      : `Fast recognition of air stroke pattern:
Mode: ${mode}, Language: ${language || "English"}
Previous: "${previousText || ""}"
Strokes: ${strokeData ? JSON.stringify(strokeData).slice(0, 400) : "Visual"}
Provide concise JSON. Keep detailedAnalysis under 25 words for ultra-low latency.`;

    contents.push(promptText);

    // 4.5s timeout for reliable neural cloud recognition
    const generatePromise = ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents,
      config: {
        systemInstruction: mode === "text"
          ? `${systemPrompt} Prioritize a correct single-character result; never return a word or sentence.`
          : `${systemPrompt} Prioritize real-time responsiveness. Output the exact recognized content.`,
        responseMimeType: "application/json",
        maxOutputTokens: 180,
        temperature: 0.1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recognizedText: {
              type: Type.STRING,
              description: "The primary recognized character, word, equation, or gesture.",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence percentage from 0 to 100.",
            },
            autoCorrected: {
              type: Type.STRING,
              description: "Smart auto-corrected version.",
            },
            predictions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 likely next predictions.",
            },
            detailedAnalysis: {
              type: Type.STRING,
              description: "Brief 1-2 sentence breakdown.",
            },
            strokeQuality: {
              type: Type.STRING,
              description: "Stroke quality: 'Optimal Flow', 'High Precision', etc.",
            },
          },
          required: ["recognizedText", "confidence", "autoCorrected", "predictions", "detailedAnalysis", "strokeQuality"],
        },
      },
    });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("SPEED_TIMEOUT")), 4500);
    });

    let response: any;
    try {
      response = await Promise.race([generatePromise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
    const resultJson = JSON.parse(response.text || "{}");
    if (mode === "text") {
      const character = String(resultJson.recognizedText || "").trim().toUpperCase();
      const confidence = Number(resultJson.confidence);
      if (!/^[A-Z0-9]$/.test(character) || !Number.isFinite(confidence) || confidence < 75) {
        return res.status(422).json({
          success: false,
          error: "Cloud vision could not confidently identify one character.",
        });
      }
      resultJson.recognizedText = character;
      resultJson.autoCorrected = character;
      resultJson.predictions = [];
    }
    res.json({ success: true, data: resultJson });
  } catch (error: any) {
    console.warn("AI Recognition failed:", error.message || error);
    res.status(503).json({
      success: false,
      error: "Cloud AI analysis is unavailable. Check the API key and network, then try again.",
    });
  }
});

// AI Word Prediction & Auto-Correction endpoint
app.post("/api/ai/predict-word", async (req, res) => {
  try {
    const { currentText, language } = req.body;
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Given the partially written text from an air-writer: "${currentText}" in language "${language || "English"}", suggest 4 smart autocomplete word predictions and 1 grammar/spelling auto-correction if needed.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            autoCorrectedText: {
              type: Type.STRING,
            },
            grammarTip: {
              type: Type.STRING,
            },
          },
          required: ["predictions", "autoCorrectedText"],
        },
      },
    });

    res.json({ success: true, data: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.warn("AI Predict fallback:", error.message || error);
    res.json({
      success: true,
      isFallback: true,
      data: {
        predictions: ["Next", "Neural", "Recognition", "Gesture"],
        autoCorrectedText: req.body.currentText || "",
      },
    });
  }
});

// AI Summarization & OCR Enhancement endpoint
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { text, mode } = req.body;
    const ai = getAiClient();

    const prompt = mode === "enhance"
      ? `You are an OCR Enhancement specialist. Polish, format, and structure this transcribed air-written note into a professional document with clear headings, bullet points, and clean syntax:\n\n${text}`
      : `Summarize these air-written notes into 3 concise executive bullet points, highlight any action items, and generate a creative title:\n\n${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            formattedContent: { type: Type.STRING },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["title", "formattedContent", "keyTakeaways"],
        },
      },
    });

    res.json({ success: true, data: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.warn("AI Summarize fallback:", error.message || error);
    res.json({
      success: true,
      isFallback: true,
      data: {
        title: "Air Written Note Summary",
        formattedContent: req.body.text || "Comprehensive air writing session recorded.",
        keyTakeaways: ["Recorded via SCRIPTORA AI Neural Air Writing Engine", "Transcribed with spatial accuracy", "Preserved in local vault"],
        actionItems: ["Review air stroke formulas"],
      },
    });
  }
});

// AI Text-to-Speech endpoint (AI TTS with ultra-fast fallback)
app.post("/api/ai/tts", async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [{ parts: [{ text: `Say clearly and naturally: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ success: true, audioBase64: base64Audio });
    } else {
      throw new Error("No audio generated by TTS model.");
    }
  } catch (error: any) {
    console.warn("AI TTS fallback to browser speech synthesis:", error.message || error);
    res.json({ success: false, fallbackToBrowserTTS: true, error: error.message });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SCRIPTORA AI Server running on http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}
