import "dotenv/config";
import express from "express";
import cors from "cors";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const app = express();
const port = Number(process.env.PORT || 8787);
const groqApiKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_BACKUP_API_KEY,
  ...(process.env.GROQ_API_KEYS || "").split(",")
].map((key) => key?.trim()).filter(Boolean);
const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const groqVisionModel = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const pollingEnabled = process.env.TELEGRAM_POLLING !== "false";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const conversations = new Map();
const auditEvents = [];
const eventClients = new Set();
const backendActions = [];
let telegramOffset = 0;
let polling = false;
let lastTelegramError = null;
let lastGroqError = null;

const hardRedFlags = [
  "severe breathing difficulty",
  "cannot wake",
  "seizure",
  "stiff neck",
  "purple",
  "blood-colored spots",
  "less than 12 weeks",
  "dehydration",
  "very sick",
  "104",
  "nonstop crying",
  "weak immune"
];

function nowStamp() {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date());
}

function isoId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emitEvent(type, payload = {}) {
  const event = JSON.stringify({ type, at: nowStamp(), ...payload });
  for (const client of eventClients) {
    client.write(`data: ${event}\n\n`);
  }
}

function recordAction(type, payload = {}) {
  const action = { id: isoId("ACT"), type, payload, at: nowStamp() };
  backendActions.unshift(action);
  auditEvents.unshift(action);
  emitEvent("backend-action", { actionType: type, preview: payload.label || payload.name || payload.id || "Action completed" });
  return action;
}

async function groqChatCompletion(options) {
  let lastError = null;
  for (const apiKey of groqApiKeys) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${apiKey}`
      }
    });
    if (response.ok) return response;
    const text = await response.text();
    lastError = `${response.status} ${text}`;
    if (![401, 403, 408, 409, 429, 500, 502, 503, 504].includes(response.status)) {
      lastGroqError = lastError;
      return new Response(text, { status: response.status, statusText: response.statusText });
    }
  }
  lastGroqError = lastError;
  return new Response(lastError || "Groq request failed", { status: 502 });
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function mockPrescriptionFromUpload(fileName = "uploaded_prescription.jpg") {
  const readableName = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return {
    id: isoId("OCR-RX"),
    sourceFile: fileName,
    uhid: `SUR-${Math.floor(720000 + Math.random() * 90000)}`,
    patient: readableName ? `${readableName.split(" ")[0]} Mehta` : "Aarav Mehta",
    guardian: "Guardian from uploaded file",
    doctor: "Dr. Hardik Shah",
    department: "Pediatrics",
    branch: "Santacruz",
    date: "2026-05-04",
    confidence: 78,
    reviewStatus: "Human Review Required",
    medicines: [
      { name: "Paracetamol suspension", strength: "125mg/5ml", frequency: "SOS", duration: "3 days", price: 160 },
      { name: "ORS sachet", strength: "1 sachet", frequency: "TDS", duration: "2 days", price: 90 },
      { name: "Saline nasal drops", strength: "5ml", frequency: "BD", duration: "5 days", price: 120 },
      { name: "Probiotic sachet", strength: "1 sachet", frequency: "OD", duration: "5 days", price: 260 }
    ],
    tests: ["CBC"],
    purchased: [],
    status: "Not captured",
    ocrNotes: `Fallback extraction used for ${fileName}. Upload a clear image for Groq vision OCR; please review before use.`
  };
}

function isPdfUpload(fileName, mimeType) {
  return String(mimeType || "").includes("pdf") || String(fileName || "").toLowerCase().endsWith(".pdf");
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:[^;]+;base64,(.+)$/);
  if (!match) throw new Error("Upload data URL is not base64 encoded.");
  return Buffer.from(match[1], "base64");
}

async function pdfDataUrlToImageDataUrls(dataUrl, maxPages = 3) {
  const pdfBuffer = dataUrlToBuffer(dataUrl);
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableWorker: true,
    useSystemFonts: true
  }).promise;
  const pageLimit = Math.min(pdf.numPages, maxPages);
  const images = [];
  let extractedText = "";

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const canvasContext = canvas.getContext("2d");
    await page.render({ canvasContext, viewport }).promise;

    const imageBuffer = canvas.toBuffer("image/png");
    images.push(`data:image/png;base64,${imageBuffer.toString("base64")}`);

    try {
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).filter(Boolean).join(" ");
      extractedText += `\nPage ${pageNumber}: ${pageText}`;
    } catch {
      extractedText += `\nPage ${pageNumber}: Text layer unavailable`;
    }
  }

  return { imageDataUrls: images, pageCount: pdf.numPages, renderedPages: pageLimit, extractedText: extractedText.trim() };
}

async function ocrPrescriptionWithGroq({ fileName, mimeType, dataUrl }) {
  const fallback = mockPrescriptionFromUpload(fileName);
  let imageDataUrls = [];
  let pdfContext = null;

  try {
    if (String(mimeType || "").startsWith("image/")) {
      imageDataUrls = [dataUrl];
    } else if (isPdfUpload(fileName, mimeType)) {
      pdfContext = await pdfDataUrlToImageDataUrls(dataUrl);
      imageDataUrls = pdfContext.imageDataUrls;
    }
  } catch (error) {
    lastGroqError = `PDF OCR preparation failed: ${error.message}`;
    return {
      ...fallback,
      ocrNotes: `PDF/image preparation failed for ${fileName}: ${error.message}. Human review required.`
    };
  }

  if (!groqApiKeys.length || !imageDataUrls.length) {
    return {
      ...fallback,
      ocrNotes: isPdfUpload(fileName, mimeType)
        ? `Fallback extraction used for ${fileName}. PDF OCR needs Groq credentials and a readable PDF.`
        : `Fallback extraction used for ${fileName}. Upload a clear image or PDF for Groq vision OCR; please review before use.`
    };
  }

  const imageContent = imageDataUrls.map((url) => ({ type: "image_url", image_url: { url } }));
  const pdfInstruction = pdfContext
    ? `This upload is a PDF. ${pdfContext.renderedPages} of ${pdfContext.pageCount} page(s) were rendered for OCR. Digital text layer, if useful: ${pdfContext.extractedText || "none"}`
    : "This upload is a prescription image.";

  try {
    const response = await groqChatCompletion({
      method: "POST",
      body: JSON.stringify({
        model: groqVisionModel,
        temperature: 0,
        max_completion_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Extract this pediatric prescription into JSON for a Surya Hospitals PoC.",
                  pdfInstruction,
                  "Do not diagnose or prescribe. Only transcribe/extract what appears visible.",
                  "Return fields: uhid, patient, guardian, doctor, department, date, medicines array with name strength frequency duration, tests array, confidence 0-100, reviewStatus, ocrNotes.",
                  "Use fictional-safe placeholders if unreadable. Mark low confidence and Human Review Required if uncertain."
                ].join(" ")
              },
              ...imageContent
            ]
          }
        ]
      })
    });
    if (!response.ok) {
      lastGroqError = `${response.status} ${await response.text()}`;
      return fallback;
    }
    const json = await response.json();
    const rawOcrText = json.choices?.[0]?.message?.content || "";
    const extracted = safeJsonParse(rawOcrText, fallback);
    const medicines = Array.isArray(extracted.medicines) && extracted.medicines.length ? extracted.medicines : fallback.medicines;
    return {
      ...fallback,
      ...extracted,
      id: isoId("OCR-RX"),
      sourceFile: fileName,
      confidence: Number(extracted.confidence || fallback.confidence),
      reviewStatus: Number(extracted.confidence || fallback.confidence) < 85 ? "Human Review Required" : "Reviewed",
      medicines: medicines.map((medicine, index) => ({
        name: medicine.name || fallback.medicines[index % fallback.medicines.length].name,
        strength: medicine.strength || "Needs review",
        frequency: medicine.frequency || "Needs review",
        duration: medicine.duration || "Needs review",
        price: 120 + index * 80
      })),
      tests: Array.isArray(extracted.tests) ? extracted.tests : fallback.tests,
      purchased: [],
      status: "Not captured",
      sourcePages: pdfContext?.renderedPages || 1,
      totalPdfPages: pdfContext?.pageCount,
      ocrNotes: extracted.ocrNotes || `Groq vision OCR extracted from ${fileName}${pdfContext ? ` using ${pdfContext.renderedPages} rendered PDF page(s)` : ""}. Review raw model output before operational use.`,
      rawOcrText
    };
  } catch (error) {
    lastGroqError = error.message;
    return fallback;
  }
}

function topicFor(text) {
  const lower = text.toLowerCase();
  if (/fever|temperature|104|103/.test(lower)) return "fever";
  if (/cough|cold|breath|wheez/.test(lower)) return "cough";
  if (/vaccine|vaccination|immuni/.test(lower)) return "vaccination";
  if (/food|feed|nutrition|milk/.test(lower)) return "nutrition";
  if (/rash|spots|skin/.test(lower)) return "rash";
  if (/vomit|loose motion|diarr/.test(lower)) return "vomiting";
  if (/appointment|book|visit|doctor/.test(lower)) return "appointment";
  if (/medicine|pharmacy|drug/.test(lower)) return "pharmacy";
  if (/test|lab|report/.test(lower)) return "lab";
  return "general";
}

function extractAge(text) {
  const lower = text.toLowerCase();
  const months = lower.match(/(\d{1,2})\s*(month|months|mo)\b/);
  if (months) return `${months[1]} months`;
  const years = lower.match(/(\d{1,2})\s*(year|years|yr|yrs)\b/);
  if (years) return `${years[1]} yrs`;
  return "Missing";
}

function extractTemperature(text) {
  return text.match(/\b(9[8-9]|10[0-6])(?:\.\d)?\s*(?:f)?\b/i)?.[0] || "Not captured";
}

function safetySnapshot(text) {
  const lower = text.toLowerCase();
  const redFlags = hardRedFlags.filter((flag) => lower.includes(flag));
  const age = extractAge(text);
  if (age === "2 months" || age === "1 months" || age === "1 month") {
    redFlags.push("Fever in baby less than 12 weeks old");
  }
  const symptoms = [
    /fever|temperature/.test(lower) && "fever",
    /cough|cold/.test(lower) && "cough",
    /breath|wheez/.test(lower) && "breathing concern",
    /vomit|diarr|loose motion/.test(lower) && "vomiting/loose motions",
    /rash|spots/.test(lower) && "rash",
    /not feeding|poor feeding/.test(lower) && "poor feeding",
    /urine|pee/.test(lower) && "urine concern"
  ].filter(Boolean);
  const missing = [
    age === "Missing" && "child age",
    extractTemperature(text) === "Not captured" && topicFor(text) === "fever" && "temperature reading",
    !/breath|wheez/.test(lower) && "breathing status",
    !/urine|pee/.test(lower) && "urine count",
    !/feed|milk|food/.test(lower) && "feeding status"
  ].filter(Boolean);
  const urgency = redFlags.length
    ? "Emergency"
    : /breath|seizure|dull|dehydrat|104/.test(lower)
      ? "Urgent Doctor Review"
      : topicFor(text) === "appointment"
        ? "Admin"
        : "Review Within 24h";
  const confidence = Math.max(62, 94 - missing.length * 6 + redFlags.length * 2);
  return { age, temperature: extractTemperature(text), symptoms, redFlags: [...new Set(redFlags)], missing, urgency, confidence };
}

function fallbackDraft(message, snapshot) {
  if (snapshot.redFlags.length) {
    return "I understand this can be worrying. Because your message includes a possible emergency red flag, please visit emergency care immediately or call Surya emergency support now. I am routing this to the pediatric team for urgent review. If you can do so without delaying care, please share the child's age, temperature, breathing status, feeding, and urine count.";
  }
  return "I understand this can be worrying. To guide you safely, please tell me your child's age, temperature reading if fever is present, how long symptoms have been there, and whether there is breathing difficulty, unusual sleepiness, seizure, poor feeding, or no urine for 8 hours. A Surya reviewer will check this before final guidance is sent.";
}

function enforceDraftSafety(draft, snapshot) {
  if (snapshot.redFlags.length) return fallbackDraft("", snapshot);
  const unsafePattern = /\b(antibiotic|amoxicillin|azithromycin|diagnos(?:e|is)|prescrib(?:e|ed|ing)|dosage|dose)\b/i;
  let text = String(draft || fallbackDraft("", snapshot)).replace(/^"+|"+$/g, "").trim();
  text = text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !unsafePattern.test(sentence))
    .join(" ")
    .trim();
  if (!text) text = fallbackDraft("", snapshot);
  if (snapshot.missing.includes("child age") && !/age/i.test(text)) {
    text += " Please also share your child's age.";
  }
  if (!/doctor|reviewer|care team|pediatric team/i.test(text)) {
    text += " A Surya reviewer will check this before final guidance is sent.";
  }
  if (!/not a diagnosis|does not diagnose|not diagnose|not a prescription|does not prescribe/i.test(text)) {
    text += " This is not a diagnosis or prescription.";
  }
  return text;
}

async function generateGroqDraft(message, snapshot) {
  if (!groqApiKeys.length) return enforceDraftSafety(fallbackDraft(message, snapshot), snapshot);

  const system = [
    "You draft pediatric Telegram replies for Surya Hospitals.",
    "This is a PoC, not a medical device.",
    "Never diagnose. Never prescribe. Never suggest antibiotics. Never provide dosage unless explicitly doctor-approved FAQ content.",
    "Use calm, warm, safety-first, parent-friendly, non-diagnostic language.",
    "Keep short Telegram-friendly paragraphs.",
    "If red flags are present, advise urgent/emergency care immediately.",
    "Say doctor/care team review is needed before final clinical guidance."
  ].join(" ");

  const user = JSON.stringify({
    parentMessage: message,
    safetySnapshot: snapshot,
    desiredTone: {
      safetyFirstClarity: "30%",
      warmth: "20%",
      simpleLanguage: "20%",
      actionOrientation: "15%",
      institutionalTrust: "10%",
      privacyConsentSensitivity: "5%"
    }
  });

  try {
    const response = await groqChatCompletion({
      method: "POST",
      body: JSON.stringify({
        model: groqModel,
        temperature: 0.25,
        max_tokens: 360,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });
    if (!response.ok) {
      lastGroqError = `${response.status} ${await response.text()}`;
      return enforceDraftSafety(fallbackDraft(message, snapshot), snapshot);
    }
    const json = await response.json();
    return enforceDraftSafety(json.choices?.[0]?.message?.content?.trim() || fallbackDraft(message, snapshot), snapshot);
  } catch (error) {
    lastGroqError = error.message;
    return enforceDraftSafety(fallbackDraft(message, snapshot), snapshot);
  }
}

function toUiConversation(item) {
  return {
    id: item.id,
    source: "telegram-live",
    telegramChatId: item.telegramChatId,
    parentName: item.parentName,
    childName: item.childName || "Child details pending",
    childAge: item.snapshot.age,
    temperature: item.snapshot.temperature,
    telegramHandle: item.telegramHandle,
    consent: "Telegram opt-in",
    language: "English",
    topic: item.topic,
    preview: item.latestMessage,
    receivedAt: item.receivedAt,
    urgency: item.snapshot.urgency,
    confidence: item.snapshot.confidence,
    reviewer: "Doctor Review Queue",
    branch: "Santacruz",
    department: "Pediatrics",
    pinCode: "400054",
    status: item.status,
    symptoms: item.snapshot.symptoms.length ? item.snapshot.symptoms : [item.topic],
    redFlags: item.snapshot.redFlags,
    missing: item.snapshot.missing,
    aiDraft: item.aiDraft,
    parentMessages: item.messages
  };
}

async function sendTelegram(chatId, text) {
  if (!telegramToken) throw new Error("Telegram token missing");
  const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

async function handleTelegramMessage(message) {
  const text = message.text?.trim();
  if (!text) return;
  const chat = message.chat;
  const chatId = chat.id;
  const fromName = [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || "Telegram parent";

  if (text === "/start") {
    await sendTelegram(chatId, "Hi, welcome to Surya Parent Circle PoC. Share your child-health question and the care team will review it. This bot does not diagnose or prescribe. If your child has severe breathing difficulty, seizure, cannot wake up, dehydration, fever above 104 F, or looks very sick, please seek emergency care immediately.");
    return;
  }

  const immediateAck = "Hi, thanks for messaging Surya Parent Circle. We have received your question and routed it to the doctor review queue. This bot does not diagnose or prescribe; a Surya reviewer will approve any clinical response before it is sent.";
  try {
    await sendTelegram(chatId, immediateAck);
  } catch (error) {
    lastTelegramError = error.message;
  }

  const snapshot = safetySnapshot(text);
  const existing = conversations.get(String(chatId));
  const parentMessage = { from: "parent", text, time: nowStamp() };
  const ack = {
    from: "surya",
    text: immediateAck,
    time: nowStamp(),
    draft: true
  };
  const item = {
    id: existing?.id || isoId("TG"),
    telegramChatId: chatId,
    telegramHandle: chat.username ? `@${chat.username}` : `chat ${chatId}`,
    parentName: fromName,
    childName: existing?.childName || "Child details pending",
    latestMessage: text,
    receivedAt: nowStamp(),
    topic: topicFor(text),
    snapshot,
    aiDraft: "Generating a doctor-reviewable AI draft...",
    status: snapshot.redFlags.length ? "Escalated" : "New",
    messages: [...(existing?.messages || []), parentMessage, ack]
  };
  conversations.set(String(chatId), item);
  emitEvent("telegram-message", {
    conversationId: item.id,
    parentName: item.parentName,
    urgency: item.snapshot.urgency,
    preview: item.latestMessage
  });

  if (snapshot.redFlags.length) {
    try {
      await sendTelegram(chatId, "Your message includes a possible emergency red flag. Please seek emergency care immediately or call Surya emergency support now. This bot does not diagnose or prescribe.");
    } catch (error) {
      lastTelegramError = error.message;
    }
  }

  item.aiDraft = await generateGroqDraft(text, snapshot);
  item.status = snapshot.redFlags.length ? "Escalated" : "AI Drafted";
  conversations.set(String(chatId), item);
  emitEvent("ai-draft-ready", {
    conversationId: item.id,
    parentName: item.parentName,
    urgency: item.snapshot.urgency,
    preview: item.latestMessage
  });
}

async function pollTelegram() {
  if (!telegramToken || !pollingEnabled || polling) return;
  polling = true;
  while (polling) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/getUpdates?timeout=25&offset=${telegramOffset}`);
      if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
      const json = await response.json();
      for (const update of json.result || []) {
        telegramOffset = update.update_id + 1;
        if (update.message) await handleTelegramMessage(update.message);
      }
      lastTelegramError = null;
    } catch (error) {
      lastTelegramError = error.message;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    groqConfigured: Boolean(groqApiKeys.length),
    groqKeyCount: groqApiKeys.length,
    telegramConfigured: Boolean(telegramToken),
    telegramPolling: polling,
    liveTelegramConversations: conversations.size,
    lastTelegramError,
    lastGroqError,
    timestamp: nowStamp()
  });
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify({ type: "connected", at: nowStamp() })}\n\n`);
  eventClients.add(res);
  req.on("close", () => {
    eventClients.delete(res);
  });
});

app.get("/api/telegram/conversations", (_req, res) => {
  res.json([...conversations.values()].map(toUiConversation).reverse());
});

app.post("/api/telegram/simulate", async (req, res) => {
  const text = String(req.body?.message || "My 4 year old has fever 102 F since morning and mild cough. Please guide.").trim();
  const snapshot = safetySnapshot(text);
  const id = isoId("SIM");
  const item = {
    id,
    telegramChatId: `demo-${Date.now()}`,
    telegramHandle: "@surya_demo_parent",
    parentName: req.body?.parentName || "Neha Mehta",
    childName: req.body?.childName || "Aarav Mehta",
    latestMessage: text,
    receivedAt: nowStamp(),
    topic: topicFor(text),
    snapshot,
    aiDraft: "Generating a doctor-reviewable AI draft...",
    status: snapshot.redFlags.length ? "Escalated" : "New",
    messages: [
      { from: "parent", text, time: nowStamp() },
      {
        from: "surya",
        text: "Hi, thanks for messaging Surya Parent Circle. We have received your question and routed it to the doctor review queue.",
        time: nowStamp(),
        draft: true
      }
    ]
  };
  conversations.set(String(item.telegramChatId), item);
  emitEvent("telegram-message", { conversationId: id, parentName: item.parentName, urgency: snapshot.urgency, preview: text });
  item.aiDraft = await generateGroqDraft(text, snapshot);
  item.status = snapshot.redFlags.length ? "Escalated" : "AI Drafted";
  conversations.set(String(item.telegramChatId), item);
  emitEvent("ai-draft-ready", { conversationId: id, parentName: item.parentName, urgency: snapshot.urgency, preview: text });
  recordAction("SimulatedTelegramMessage", { id, label: "Demo Telegram case created" });
  res.json(toUiConversation(item));
});

app.post("/api/telegram/conversations/:id/draft", async (req, res) => {
  const item = [...conversations.values()].find((conversation) => conversation.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Conversation not found" });
  item.aiDraft = await generateGroqDraft(item.latestMessage, item.snapshot);
  item.status = "AI Drafted";
  res.json(toUiConversation(item));
});

app.post("/api/telegram/conversations/:id/approve-send", async (req, res) => {
  const item = [...conversations.values()].find((conversation) => conversation.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Conversation not found" });
  const text = String(req.body?.text || item.aiDraft || "").trim();
  if (!text) return res.status(400).json({ error: "Approved text is required" });
  if (!String(item.telegramChatId).startsWith("demo-")) {
    await sendTelegram(item.telegramChatId, text);
  }
  item.status = "Sent";
  item.aiDraft = text;
  item.messages.push({ from: "surya", text, time: nowStamp() });
  auditEvents.unshift({
    id: isoId("AUDIT"),
    type: "DoctorApprovedTelegramSend",
    conversationId: item.id,
    telegramChatId: item.telegramChatId,
    reviewer: req.body?.reviewer || "PoC reviewer",
    at: nowStamp()
  });
  emitEvent("telegram-approved-send", {
    conversationId: item.id,
    parentName: item.parentName,
    urgency: item.snapshot.urgency,
    preview: "Doctor-approved response sent to Telegram"
  });
  res.json({ conversation: toUiConversation(item), auditEvents });
});

app.post("/api/ai/draft", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({ error: "message is required" });
  const snapshot = safetySnapshot(message);
  const draft = await generateGroqDraft(message, snapshot);
  res.json({ snapshot, draft, model: groqModel, lastGroqError });
});

app.post("/api/recovery/tasks", (req, res) => {
  const task = {
    id: isoId("TASK"),
    priority: req.body?.priority || "High",
    patient: req.body?.patient || "Aarav Mehta",
    leakageType: req.body?.leakageType || "Pharmacy",
    estimatedValue: req.body?.estimatedValue || 1850,
    assigned: req.body?.assigned || "Care Team A",
    status: "Open",
    due: "Today, 17:30"
  };
  recordAction("RecoveryTaskCreated", { id: task.id, label: `${task.leakageType} task for ${task.patient}` });
  res.json(task);
});

app.post("/api/prescriptions/mock-upload", (req, res) => {
  const prescription = {
    id: isoId("RX"),
    uhid: `SUR-${Math.floor(700000 + Math.random() * 99999)}`,
    patient: req.body?.patient || "Kiara Shah",
    guardian: "Rohan Shah",
    doctor: req.body?.doctor || "Dr. Hardik Shah",
    department: "Pediatrics",
    branch: "Santacruz",
    date: "2026-05-04",
    confidence: 88,
    reviewStatus: "Human Review Required",
    medicines: [
      { name: "Paracetamol suspension", strength: "125mg/5ml", frequency: "SOS", duration: "3 days", price: 160 },
      { name: "ORS sachet", strength: "1 sachet", frequency: "TDS", duration: "2 days", price: 90 },
      { name: "Saline nasal drops", strength: "5ml", frequency: "BD", duration: "5 days", price: 120 },
      { name: "Probiotic sachet", strength: "1 sachet", frequency: "OD", duration: "5 days", price: 260 }
    ],
    purchased: [],
    status: "Not captured"
  };
  recordAction("PrescriptionUploaded", { id: prescription.id, label: `${prescription.id} extracted` });
  res.json(prescription);
});

app.post("/api/prescriptions/ocr-upload", async (req, res) => {
  const fileName = req.body?.fileName || "uploaded_prescription.jpg";
  const mimeType = req.body?.mimeType || "application/octet-stream";
  const dataUrl = req.body?.dataUrl;
  if (!dataUrl) return res.status(400).json({ error: "dataUrl is required" });
  const prescription = await ocrPrescriptionWithGroq({ fileName, mimeType, dataUrl });
  recordAction("PrescriptionOcrUploaded", { id: prescription.id, label: `${prescription.sourceFile} OCR extracted` });
  res.json(prescription);
});

app.post("/api/lab/follow-up", (req, res) => {
  const action = recordAction("LabFollowUpSent", {
    id: req.body?.testId || "LAB-DEMO",
    label: `Lab follow-up queued for ${req.body?.patient || "selected patient"}`
  });
  res.json({ ok: true, action });
});

app.post("/api/imports/run", (req, res) => {
  const name = req.body?.name || "Data import";
  const result = {
    name,
    imported: 80 + Math.floor(Math.random() * 240),
    failed: Math.floor(Math.random() * 8),
    mapping: "Mapped",
    last: nowStamp(),
    quality: 88 + Math.floor(Math.random() * 10)
  };
  recordAction("ImportRun", { id: name, label: `${name} completed` });
  res.json(result);
});

app.post("/api/imports/upload", (req, res) => {
  const name = req.body?.name || "Uploaded import";
  const fileName = req.body?.fileName || "uploaded.csv";
  const text = String(req.body?.text || "");
  const rows = text ? text.split(/\r?\n/).filter(Boolean).length : Number(req.body?.rows || 0);
  const result = {
    name,
    fileName,
    imported: Math.max(0, rows - 1),
    failed: Math.min(6, Math.floor(rows * 0.02)),
    mapping: rows ? "Mapped" : "Needs mapping",
    last: nowStamp(),
    quality: rows ? 91 : 72
  };
  recordAction("ImportUploaded", { id: name, label: `${fileName} imported` });
  res.json(result);
});

app.post("/api/actions", (req, res) => {
  const action = recordAction(req.body?.type || "DemoAction", req.body?.payload || {});
  res.json(action);
});

app.get("/api/audit", (_req, res) => {
  res.json(auditEvents);
});

app.get("/api/actions", (_req, res) => {
  res.json(backendActions);
});

export default app;

if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Surya PoC backend listening on http://0.0.0.0:${port}`);
    if (telegramToken && pollingEnabled) pollTelegram();
  });
}
