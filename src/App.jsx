import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  Filter,
  HeartPulse,
  Hospital,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  Microscope,
  Pill,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  Users,
  WalletCards
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const branches = ["Santacruz", "Chembur", "Pune Wakad"];
const departments = ["Pediatrics", "Neonatology", "ENT", "Dermatology", "Gastroenterology", "Radiology"];
const doctors = [
  "Dr. Hardik Shah",
  "Dr. Avasti Mehta",
  "Dr. Rhea Nair",
  "Dr. Kunal Rao",
  "Dr. Meenal Doshi",
  "Dr. Arjun Iyer",
  "Dr. Sara Fernandes",
  "Dr. Devika Kulkarni"
];
const pinCodes = ["400054", "400055", "400071", "400089", "400705", "400706", "401107", "401202", "421301", "421306", "410210", "411057"];
const firstNames = ["Aarav", "Vihaan", "Anaya", "Ira", "Kabir", "Myra", "Reyansh", "Saanvi", "Ayaan", "Kiara", "Neil", "Tara"];
const surnames = ["Mehta", "Shah", "Iyer", "Nair", "Patel", "Fernandes", "Rao", "Doshi", "Kapoor", "Kulkarni", "Desai", "Shetty"];
const topics = ["fever", "cough", "vaccination", "nutrition", "rash", "vomiting", "appointment", "pharmacy", "lab", "general"];
const meds = ["Paracetamol suspension", "ORS sachet", "Saline nasal drops", "Cetirizine syrup", "Zinc oral solution", "Vitamin D3 drops", "Probiotic sachet", "Calamine lotion", "Iron syrup", "Nebulization kit"];
const tests = ["CBC", "CRP", "Dengue NS1", "Urine routine", "Throat swab", "Chest X-Ray", "LFT", "Electrolytes", "Blood culture", "Stool routine"];
const API_BASE = import.meta.env.VITE_API_BASE || "";

const navItems = [
  ["Overview", LayoutDashboard],
  ["Parent Circle", MessageCircle],
  ["Doctor Review Queue", Stethoscope],
  ["Revenue Recovery", WalletCards],
  ["Prescription Intelligence", Pill],
  ["Test Leakage", Microscope],
  ["Command Centre", BarChart3],
  ["Data Imports", Upload],
  ["Settings / Governance", Settings]
];

function pick(list, i) {
  return list[i % list.length];
}

function money(value) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function isoDateFor(i, spanDays = 2555) {
  const base = new Date("2026-05-04T00:00:00+05:30");
  base.setDate(base.getDate() - (i % spanDays));
  return base.toISOString().slice(0, 10);
}

function operationalDateFor(i, recentWindow = 40) {
  if (i < recentWindow) return isoDateFor(i % 4, 4);
  return isoDateFor(i, 2555);
}

function displayDate(iso) {
  return new Date(`${iso}T10:00:00+05:30`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function inDateRange(iso, range) {
  if (!range || range.mode === "lifetime") return true;
  const value = new Date(`${iso || "2026-05-04"}T00:00:00+05:30`).getTime();
  const today = new Date("2026-05-04T00:00:00+05:30").getTime();
  const day = 24 * 60 * 60 * 1000;
  const ranges = {
    today: [today, today],
    may1to4: [new Date("2026-05-01T00:00:00+05:30").getTime(), today],
    last7days: [today - 6 * day, today],
    month1: [today - 30 * day, today],
    month3: [today - 92 * day, today],
    month6: [today - 183 * day, today],
    year1: [today - 365 * day, today],
    years7: [today - 2555 * day, today]
  };
  const [start, end] = range.mode === "custom"
    ? [new Date(`${range.start}T00:00:00+05:30`).getTime(), new Date(`${range.end}T00:00:00+05:30`).getTime()]
    : ranges[range.mode] || ranges.may1to4;
  return value >= start && value <= end;
}

function makeData() {
  const conversations = Array.from({ length: 700 }, (_, i) => {
    const iso = isoDateFor(i, 2555);
    const red = i < 20;
    const topic = red ? pick(["fever", "vomiting", "cough", "rash"], i) : pick(topics, i);
    const childAgeMonths = red && i % 4 === 0 ? 2 : 7 + ((i * 5) % 132);
    const temp = topic === "fever" ? (red ? "104.3 F" : `${99 + (i % 4)}.4 F`) : "";
    const parentName = `${pick(["Priya", "Rohan", "Neha", "Amit", "Farah", "Sonal", "Vikram", "Jaya"], i)} ${pick(surnames, i + 2)}`;
    const childName = `${pick(firstNames, i + 3)} ${pick(surnames, i + 2)}`;
    const redFlags = red
      ? [pick(["Fever in baby less than 12 weeks old", "Severe breathing difficulty", "Signs of dehydration", "Cannot wake up", "Fever above 104 F"], i)]
      : [];
    return {
      id: `COM-${1000 + i}`,
      parentName,
      childName,
      childAge: childAgeMonths < 24 ? `${childAgeMonths} months` : `${Math.floor(childAgeMonths / 12)} yrs ${childAgeMonths % 12} mo`,
      childAgeMonths,
      telegramHandle: `@surya_demo_${1000 + i}`,
      consent: i % 9 === 0 ? "Missing" : "Opted in",
      language: pick(["English", "Hindi", "Marathi", "Gujarati"], i),
      topic,
      preview:
        topic === "fever"
          ? `My child has fever ${temp} since ${red ? "last night and looks very dull" : "today morning"}. What should we do?`
          : `Need help with ${topic} for my child. Could Surya team guide us?`,
      rawDate: iso,
      receivedAt: `${displayDate(iso)}, ${String(9 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
      urgency: red ? "Emergency" : pick(["Urgent Doctor Review", "Review Within 24h", "Routine", "Admin"], i),
      confidence: red ? 94 - (i % 8) : 71 + (i % 24),
      reviewer: pick(doctors, i),
      branch: pick(branches, i),
      department: "Pediatrics",
      pinCode: pick(pinCodes, i),
      status: red ? pick(["Escalated", "In Review", "AI Drafted"], i) : pick(["New", "AI Drafted", "In Review", "Approved", "Sent"], i),
      symptoms: topic === "fever" ? ["fever", red ? "unusual sleepiness" : "reduced appetite"] : [topic],
      redFlags,
      missing: red ? ["urine count", "feeding status"] : ["temperature reading", "duration"],
      aiDraft:
        red
          ? "I understand this can be worrying. Because you mentioned a red-flag symptom, please visit emergency care immediately or call Surya emergency support now. I will also route this to the pediatric team for urgent review. Please share your child's age, temperature reading, breathing status, feeding, and urine count if you can do so without delaying care."
          : "I understand this can be worrying. To guide you safely, please tell me your child's age, temperature reading, duration of symptoms, and whether there is breathing difficulty, unusual sleepiness, seizure, poor feeding, or no urine for 8 hours. This will be reviewed by the Surya pediatric team before final guidance is sent.",
      parentMessages: [
        { from: "parent", text: topic === "fever" ? `My child has fever ${temp || "since morning"}. Please guide.` : `My child needs help with ${topic}.`, time: "09:22" },
        { from: "surya", text: "Thanks for reaching Surya Parent Circle. I am checking safety details and routing this for review.", time: "09:23", draft: true }
      ]
    };
  });

  const prescriptions = Array.from({ length: 550 }, (_, i) => {
    const iso = operationalDateFor(i, 96);
    const prescribed = Array.from({ length: 4 }, (_, j) => ({
      name: pick(meds, i + j),
      strength: pick(["125mg/5ml", "250mg/5ml", "10mg", "5ml", "1 sachet"], i + j),
      frequency: pick(["BD", "TDS", "OD", "SOS"], i + j),
      duration: `${3 + ((i + j) % 5)} days`,
      price: 120 + ((i + j) % 8) * 85
    }));
    const capturedCount = i % 5 === 0 ? 0 : i % 3 === 0 ? 2 : 4;
    return {
      id: `RX-${2200 + i}`,
      uhid: `SUR-${String(50000 + i).padStart(6, "0")}`,
      patient: `${pick(firstNames, i)} ${pick(surnames, i)}`,
      guardian: `${pick(["Maya", "Siddharth", "Pooja", "Karan"], i)} ${pick(surnames, i)}`,
      doctor: pick(doctors, i),
      department: pick(departments, i),
      branch: pick(branches, i),
      rawDate: iso,
      date: iso,
      confidence: 56 + ((i * 11) % 43),
      reviewStatus: i % 6 === 0 ? "Human Review Required" : "Reviewed",
      medicines: prescribed,
      purchased: prescribed.slice(0, capturedCount),
      status: capturedCount === 4 ? "Fully captured" : capturedCount === 0 ? "Not captured" : "Partially captured"
    };
  });

  const prescribedMedicines = prescriptions.flatMap((rx) => rx.medicines.map((m) => ({ ...m, rxId: rx.id, uhid: rx.uhid })));
  const pharmacyPurchases = prescribedMedicines.slice(0, 1200).map((m, i) => ({
    saleId: `PH-${9000 + i}`,
    ...m,
    soldAt: `${operationalDateFor(i, 180)} ${10 + (i % 8)}:${String((i * 3) % 60).padStart(2, "0")}`
  }));

  const testOrders = Array.from({ length: 750 }, (_, i) => {
    const iso = operationalDateFor(i, 120);
    const completed = i < 60;
    return {
      id: `LAB-${3000 + i}`,
      uhid: `SUR-${String(51000 + i).padStart(6, "0")}`,
      patient: `${pick(firstNames, i + 5)} ${pick(surnames, i + 1)}`,
      test: pick(tests, i),
      doctor: pick(doctors, i + 1),
      department: pick(departments, i + 2),
      branch: pick(branches, i),
      rawDate: iso,
      date: iso,
      billed: completed || i % 3 === 0,
      collected: completed || i % 5 === 0,
      report: completed,
      value: 450 + (i % 9) * 380,
      status: completed ? "Completed" : i % 3 === 0 ? "Billed not completed" : "Ordered not billed",
      followUp: completed ? "Closed" : pick(["Follow-up required", "Telegram sent", "Call scheduled", "Lost outside"], i)
    };
  });

  const recoveryTasks = Array.from({ length: 240 }, (_, i) => ({
    id: `TASK-${7000 + i}`,
    priority: pick(["Critical", "High", "Medium", "Low"], i),
    patient: `${pick(firstNames, i + 8)} ${pick(surnames, i + 4)}`,
    contact: `+91 97${(60000000 + i * 4219).toString().slice(0, 8)}`,
    leakageType: i % 2 ? "Test order" : "Pharmacy",
    value: 900 + (i % 12) * 650,
    clinicalImportance: pick(["Time-sensitive", "Routine continuity", "Follow-up advised", "Doctor requested"], i),
    rawDate: operationalDateFor(i, 48),
    due: `${displayDate(operationalDateFor(i, 48))}, ${String(11 + (i % 7)).padStart(2, "0")}:30`,
    assigned: pick(["Care Team A", "Care Team B", "Pharmacy Desk", "Lab Desk"], i),
    status: pick(["Open", "In progress", "Follow-up sent", "Converted after follow-up"], i),
    script: "Hello, this is Surya Hospitals. The doctor had advised a medicine or test during your visit. We noticed it may not have been completed at Surya yet. Would you like help with availability, timing, or booking?"
  }));

  const appointments = Array.from({ length: 650 }, (_, i) => ({
    id: `APT-${8000 + i}`,
    rawDate: operationalDateFor(i, 120),
    doctor: pick(doctors, i),
    branch: pick(branches, i),
    department: pick(departments, i),
    pinCode: pick(pinCodes, i),
    status: pick(["Arrived", "Booked", "No-show", "Rescheduled"], i),
    source: pick(["Telegram", "Call centre", "LeadSquared", "WebEngage", "Walk-in"], i)
  }));

  const calls = Array.from({ length: 650 }, (_, i) => ({
    id: `CALL-${6000 + i}`,
    rawDate: operationalDateFor(i, 120),
    type: pick(["Inbound", "Missed", "Logged", "Unlogged"], i),
    intent: pick(["Appointment", "Emergency query", "Pharmacy", "Lab", "Second opinion"], i),
    source: pick(["In-house", "Outsourced"], i),
    converted: i % 3 === 0,
    responseMin: 2 + (i % 18)
  }));

  const imports = [
    "Caresoft operations export",
    "Billing/revenue export",
    "Pharmacy sales export",
    "Pharmacy inventory export",
    "Lab/test orders export",
    "Appointment export",
    "Call centre export",
    "CRM leads export",
    "Campaign/camp calendar",
    "Telegram conversation export"
  ].map((name, i) => ({
    name,
    file: `${name.toLowerCase().replaceAll(" ", "_")}_2026_05_04.csv`,
    imported: 420 + i * 83,
    failed: i % 4 === 0 ? 12 + i : i,
    mapping: i % 5 === 0 ? "Needs mapping" : "Mapped",
    last: `2026-05-04 ${String(8 + i).padStart(2, "0")}:15`,
    quality: 74 + ((i * 7) % 23)
  }));

  return { conversations, prescriptions, prescribedMedicines, pharmacyPurchases, testOrders, recoveryTasks, appointments, calls, imports };
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Card({ title, value, sub, icon: Icon, tone = "" }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {sub && <span>{sub}</span>}
      </div>
      {Icon && <Icon size={22} />}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle, cta = "Export", onExport }) {
  return (
    <div className="section-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <button className="btn secondary" onClick={onExport}><Download size={16} />{cta}</button>
    </div>
  );
}

function SearchFilter({ search, setSearch, onFilter, children }) {
  return (
    <div className="toolbar">
      <label className="searchbox">
        <Search size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, UHID, doctor, topic..." />
      </label>
      <button className="btn ghost" onClick={onFilter || (() => setSearch(""))}><Filter size={16} />Filters</button>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Inbox size={28} />
      <strong>No records match this view</strong>
      <span>Adjust filters or widen the date range to continue the demo.</span>
    </div>
  );
}

function App() {
  const [data, setData] = useState(() => makeData());
  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All branches");
  const [department, setDepartment] = useState("All departments");
  const [doctor, setDoctor] = useState("All doctors");
  const [dateRange, setDateRange] = useState({ mode: "may1to4", start: "2026-05-01", end: "2026-05-04" });
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [liveConversations, setLiveConversations] = useState([]);
  const [topNotification, setTopNotification] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(data.conversations[0]);
  const [draft, setDraft] = useState(data.conversations[0].aiDraft);
  const [feedback, setFeedback] = useState([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [governanceSettings, setGovernanceSettings] = useState({
    doctorApproval: true,
    emergencyEscalation: true,
    communityBroadcasts: false,
    retentionMonths: 24,
    defaultRole: "Doctor reviewer",
    consentMode: "Opt-in required",
    aiTone: "Warm safety-first"
  });

  function notify(title, body = "", tone = "good", timeout = 6000) {
    setTopNotification({ title, body, tone });
    window.setTimeout(() => setTopNotification(null), timeout);
  }

  function replaceConversation(nextConversation) {
    if (nextConversation.source === "telegram-live") {
      setLiveConversations((items) => items.map((item) => item.id === nextConversation.id ? nextConversation : item));
    } else {
      setData((current) => ({
        ...current,
        conversations: current.conversations.map((item) => item.id === nextConversation.id ? nextConversation : item)
      }));
    }
  }

  async function postAction(type, payload = {}) {
    try {
      await fetch(`${API_BASE}/api/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload })
      });
    } catch {
      // The UI still updates locally if the mock backend is restarting.
    }
  }

  function exportData(label, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `surya-${label.toLowerCase().replaceAll(" ", "-")}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Export ready", `${label} data exported as JSON.`, "good");
    postAction("Export", { label });
  }

  function showFilters() {
    notify("Filters are active", `Branch: ${branch}. Department: ${department}. Doctor: ${doctor}. Date range: ${dateRange.mode}. Search is ${search ? `"${search}"` : "clear"}.`, "good");
  }

  async function simulateTelegramCase() {
    notify("Creating demo Telegram case", "Generating intake, safety snapshot, and AI draft.", "good");
    const response = await fetch(`${API_BASE}/api/telegram/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "My 4 year old has fever 102 F since morning and mild cough. Please guide.", parentName: "Neha Mehta", childName: "Aarav Mehta" })
    });
    if (response.ok) {
      const conversation = await response.json();
      setLiveConversations((items) => [conversation, ...items.filter((item) => item.id !== conversation.id)]);
      setSelectedConversation(conversation);
      setDraft(conversation.aiDraft);
      setActive("Parent Circle");
      notify("Demo Telegram case ready", `${conversation.parentName} is waiting in the doctor review queue.`, "good");
      refreshBackend();
    } else {
      notify("Could not create demo Telegram case", "The backend did not accept the simulation request.", "warn");
    }
  }

  async function generateDraftForSelected() {
    notify("Generating AI draft", "Groq is drafting a doctor-reviewable response.", "good");
    if (selectedConversation.source === "telegram-live") {
      const response = await fetch(`${API_BASE}/api/telegram/conversations/${selectedConversation.id}/draft`, { method: "POST" });
      if (response.ok) {
        const conversation = await response.json();
        setSelectedConversation(conversation);
        setDraft(conversation.aiDraft);
        replaceConversation(conversation);
        notify("AI draft refreshed", "The draft is ready for doctor review.", "good");
        return;
      }
    }
    const response = await fetch(`${API_BASE}/api/ai/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: selectedConversation.preview })
    });
    if (response.ok) {
      const result = await response.json();
      setDraft(result.draft);
      const next = {
        ...selectedConversation,
        aiDraft: result.draft,
        status: "AI Drafted",
        childAge: result.snapshot.age,
        temperature: result.snapshot.temperature,
        symptoms: result.snapshot.symptoms.length ? result.snapshot.symptoms : selectedConversation.symptoms,
        redFlags: result.snapshot.redFlags,
        missing: result.snapshot.missing,
        urgency: result.snapshot.urgency,
        confidence: result.snapshot.confidence
      };
      setSelectedConversation(next);
      replaceConversation(next);
      notify("AI draft refreshed", "The mock conversation now has a Groq-generated draft.", "good");
    } else {
      notify("Draft generation failed", "Check backend health and Groq configuration.", "warn");
    }
  }

  async function createRecoveryTask() {
    const response = await fetch(`${API_BASE}/api/recovery/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient: "Aarav Mehta", leakageType: "Pharmacy", estimatedValue: 1850 })
    });
    const backendTask = response.ok ? await response.json() : {};
    const task = {
      id: backendTask.id || `TASK-${Date.now()}`,
      priority: "High",
      patient: backendTask.patient || "Aarav Mehta",
      contact: "+91 9760001122",
      leakageType: backendTask.leakageType || "Pharmacy",
      value: backendTask.estimatedValue || 1850,
      clinicalImportance: "Doctor requested",
      due: backendTask.due || "Today, 17:30",
      assigned: backendTask.assigned || "Care Team A",
      status: "Open",
      script: "Hello, this is Surya Hospitals. The doctor had advised medicines during your visit. Would you like help with availability or pickup timing?"
    };
    setData((current) => ({ ...current, recoveryTasks: [task, ...current.recoveryTasks] }));
    notify("Recovery task created", `${task.leakageType} follow-up opened for ${task.patient}.`, "good");
  }

  function updateRecoveryTask(taskId, status) {
    setData((current) => ({
      ...current,
      recoveryTasks: current.recoveryTasks.map((task) => task.id === taskId ? { ...task, status } : task)
    }));
    notify("Recovery task updated", `${taskId} marked as ${status}.`, "good");
    postAction("RecoveryTaskUpdated", { id: taskId, label: status });
  }

  async function mockUploadPrescription() {
    const response = await fetch(`${API_BASE}/api/prescriptions/mock-upload`, { method: "POST" });
    if (response.ok) {
      const prescription = await response.json();
      setData((current) => ({ ...current, prescriptions: [prescription, ...current.prescriptions] }));
      notify("Prescription extracted", `${prescription.id} added with ${prescription.confidence}% AI confidence.`, "good");
    } else {
      notify("Prescription upload failed", "Backend mock upload endpoint did not respond.", "warn");
    }
  }

  async function ocrUploadPrescription(file) {
    if (!file) return;
    notify("AI OCR started", `${file.name} is being prepared for Groq Vision OCR. Images and PDFs are supported.`, "good", 9000);
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const response = await fetch(`${API_BASE}/api/prescriptions/ocr-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, dataUrl })
    });
    if (response.ok) {
      const prescription = await response.json();
      setData((current) => ({ ...current, prescriptions: [prescription, ...current.prescriptions] }));
      const pageNote = prescription.sourcePages ? ` ${prescription.sourcePages} page/frame(s) read.` : "";
      notify("AI OCR complete", `${prescription.id} extracted from ${file.name}.${pageNote} Human review status: ${prescription.reviewStatus}.`, "good");
      setSearch("");
      setActive("Prescription Intelligence");
    } else {
      notify("AI OCR failed", "The upload endpoint could not process this file.", "warn");
    }
  }

  async function sendLabFollowUp(selectedTest, message = "", channel = "Telegram") {
    const candidate = selectedTest || data.testOrders.find((test) => test.status !== "Completed");
    if (!candidate) {
      notify("No pending test found", "All visible test orders are complete.", "warn");
      return;
    }
    await fetch(`${API_BASE}/api/lab/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId: candidate.id, patient: candidate.patient, channel, message })
    });
    setData((current) => ({
      ...current,
      testOrders: current.testOrders.map((test) => test.id === candidate.id ? { ...test, followUp: "Telegram sent", status: test.status === "Completed" ? test.status : "Follow-up required" } : test)
    }));
    notify("Lab follow-up queued", `${channel} reminder prepared for ${candidate.patient} (${candidate.uhid}).`, "good");
  }

  async function runImport(importName) {
    const response = await fetch(`${API_BASE}/api/imports/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: importName })
    });
    const result = response.ok ? await response.json() : {};
    setData((current) => ({
      ...current,
      imports: current.imports.map((item) => item.name === importName ? {
        ...item,
        imported: item.imported + (result.imported || 120),
        failed: result.failed ?? item.failed,
        mapping: result.mapping || "Mapped",
        last: result.last || "2026-05-04 15:05",
        quality: result.quality || Math.min(98, item.quality + 3)
      } : item)
    }));
    notify("Import completed", `${importName} refreshed and quality score updated.`, "good");
  }

  async function uploadImportFile(importName, file) {
    if (!file) return;
    const text = await file.text();
    const response = await fetch(`${API_BASE}/api/imports/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: importName, fileName: file.name, text })
    });
    const result = response.ok ? await response.json() : {};
    const imported = result.imported ?? Math.max(0, text.split(/\r?\n/).filter(Boolean).length - 1);
    const failed = result.failed ?? 0;
    setData((current) => ({
      ...current,
      imports: current.imports.map((item) => item.name === importName ? {
        ...item,
        file: result.fileName || file.name,
        imported,
        failed,
        mapping: result.mapping || "Mapped",
        last: result.last || "2026-05-04 15:10",
        quality: result.quality || 90
      } : item)
    }));
    notify("File imported", `${file.name} loaded into ${importName}: ${imported} records, ${failed} failed.`, "good");
  }

  async function refreshBackend() {
    try {
      const [healthResponse, conversationsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/health`),
        fetch(`${API_BASE}/api/telegram/conversations`)
      ]);
      const health = await healthResponse.json();
      const live = await conversationsResponse.json();
      setBackendHealth(health);
      setLiveConversations(live);
      if (live.length && !selectedConversation?.source) {
        setSelectedConversation(live[0]);
        setDraft(live[0].aiDraft);
      }
    } catch {
      setBackendHealth({ ok: false, telegramConfigured: false, groqConfigured: false, telegramPolling: false, liveTelegramConversations: 0 });
    }
  }

  useEffect(() => {
    refreshBackend();
    const timer = window.setInterval(refreshBackend, 15000);
    const events = new EventSource(`${API_BASE}/api/events`);
    events.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data);
        if (event.type === "telegram-message" || event.type === "ai-draft-ready") {
          setTopNotification({
            tone: event.urgency === "Emergency" ? "danger" : "good",
            title: event.type === "telegram-message" ? "New Telegram message received" : "AI draft ready for doctor review",
            body: `${event.parentName || "Telegram parent"} - ${event.urgency || "Review"} - ${event.preview || ""}`
          });
          refreshBackend();
          window.setTimeout(() => setTopNotification(null), 8000);
        }
        if (event.type === "telegram-approved-send") {
          setTopNotification({
            tone: "good",
            title: "Doctor-approved Telegram reply sent",
            body: `${event.parentName || "Telegram parent"} - ${event.preview || ""}`
          });
          refreshBackend();
          window.setTimeout(() => setTopNotification(null), 6000);
        }
        if (event.type === "backend-action") {
          setTopNotification({
            tone: "good",
            title: "Backend action completed",
            body: event.preview || event.actionType || "Action completed"
          });
          window.setTimeout(() => setTopNotification(null), 5000);
        }
      } catch {
        refreshBackend();
      }
    };
    events.onerror = () => {
      setTopNotification({
        tone: "warn",
        title: "Live Telegram updates reconnecting",
        body: "The dashboard will keep using periodic refresh while the live stream reconnects."
      });
    };
    return () => {
      window.clearInterval(timer);
      events.close();
    };
  }, []);

  const allConversations = useMemo(() => [...liveConversations, ...data.conversations], [liveConversations, data.conversations]);
  const filters = { search, branch, department, doctor, dateRange };
  const filteredConversations = allConversations.filter((c) =>
    [c.parentName, c.childName, c.topic, c.status, c.urgency].join(" ").toLowerCase().includes(search.toLowerCase()) &&
    (branch === "All branches" || c.branch === branch) &&
    (department === "All departments" || c.department === department) &&
    (doctor === "All doctors" || c.reviewer === doctor) &&
    inDateRange(c.rawDate || "2026-05-04", dateRange)
  );
  const prescriptions = data.prescriptions.filter((p) =>
    [p.patient, p.uhid, p.doctor, p.department, p.status].join(" ").toLowerCase().includes(search.toLowerCase()) &&
    (branch === "All branches" || p.branch === branch) &&
    (department === "All departments" || p.department === department) &&
    (doctor === "All doctors" || p.doctor === doctor) &&
    inDateRange(p.rawDate || p.date, dateRange)
  );
  const testsFiltered = data.testOrders.filter((t) =>
    [t.patient, t.uhid, t.test, t.status, t.doctor].join(" ").toLowerCase().includes(search.toLowerCase()) &&
    (branch === "All branches" || t.branch === branch) &&
    (department === "All departments" || t.department === department) &&
    (doctor === "All doctors" || t.doctor === doctor) &&
    inDateRange(t.rawDate || t.date, dateRange)
  );
  const filteredAppointments = data.appointments.filter((item) =>
    (branch === "All branches" || item.branch === branch) &&
    (department === "All departments" || item.department === department) &&
    (doctor === "All doctors" || item.doctor === doctor) &&
    inDateRange(item.rawDate, dateRange)
  );
  const filteredCalls = data.calls.filter((item) => inDateRange(item.rawDate, dateRange));

  const totals = useMemo(() => {
    const scopedMedicineRows = prescriptions.flatMap((rx) => rx.medicines.map((m) => ({ ...m, rxId: rx.id, uhid: rx.uhid })));
    const scopedRxIds = new Set(prescriptions.map((rx) => rx.id));
    const prescribedValue = scopedMedicineRows.reduce((a, b) => a + b.price, 0);
    const captured = data.pharmacyPurchases.filter((sale) => scopedRxIds.has(sale.rxId)).reduce((a, b) => a + b.price, 0);
    const testValue = testsFiltered.reduce((a, b) => a + b.value, 0);
    const completedValue = testsFiltered.filter((t) => t.status === "Completed").reduce((a, b) => a + b.value, 0);
    return {
      prescribedValue,
      captured,
      pharmacyLeakage: prescribedValue - captured,
      testsOrdered: testsFiltered.length,
      testsCompleted: testsFiltered.filter((t) => t.status === "Completed").length,
      testLeakage: testValue - completedValue,
      recoveryValue: data.recoveryTasks.reduce((a, b) => a + b.value, 0)
    };
  }, [data.pharmacyPurchases, data.recoveryTasks, prescriptions, testsFiltered]);

  async function approveDraft(action = "Approved") {
    setFeedback((items) => [
      { id: `FB-${items.length + 1}`, conversationId: selectedConversation.id, action, before: selectedConversation.aiDraft, after: draft, at: "2026-05-04 14:32", reviewer: selectedConversation.reviewer },
      ...items
    ]);
    const nextStatus = action === "Emergency Escalated" ? "Escalated" : action === "Unsafe Draft" ? "In Review" : "Approved";
    const nextConversation = { ...selectedConversation, status: nextStatus, aiDraft: draft };
    setSelectedConversation(nextConversation);
    replaceConversation(nextConversation);
    notify("Review action saved", `${action} logged for ${selectedConversation.childName}.`, action === "Emergency Escalated" ? "danger" : "good");
    postAction("DoctorReviewAction", { id: selectedConversation.id, label: action });

    if (selectedConversation.source === "telegram-live" && action.includes("Send")) {
      try {
        const response = await fetch(`${API_BASE}/api/telegram/conversations/${selectedConversation.id}/approve-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft, reviewer: selectedConversation.reviewer })
        });
        if (response.ok) {
          const result = await response.json();
          setSelectedConversation(result.conversation);
          setDraft(result.conversation.aiDraft);
          replaceConversation(result.conversation);
          notify("Telegram reply sent", "The doctor-approved answer has been sent.", "good");
          refreshBackend();
        } else {
          notify("Telegram send failed", "The backend rejected the approved reply.", "warn");
        }
      } catch {
        setFeedback((items) => [
          { id: `FB-${items.length + 1}`, conversationId: selectedConversation.id, action: "Telegram send failed", before: selectedConversation.aiDraft, after: draft, at: "2026-05-04 14:33", reviewer: selectedConversation.reviewer },
          ...items
        ]);
        notify("Telegram send failed", "Check bot token, chat state, or backend health.", "warn");
      }
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Hospital size={25} /></div>
          <div><strong>Surya Hospitals</strong><span>Growth & Care Suite</span></div>
        </div>
        <nav>
          {navItems.map(([label, Icon]) => (
            <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="safety-note">
          <ShieldCheck size={18} />
          <span>AI drafts only. Clinical messages require review and logged approval.</span>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="logo-placeholder">SURYA</div>
          <select value={dateRange.mode} onChange={(e) => { setDateRange((current) => ({ ...current, mode: e.target.value })); setShowCustomDates(e.target.value === "custom"); }}>
            <option value="may1to4">May 1-4, 2026</option>
            <option value="today">Today</option>
            <option value="last7days">Last 7 days</option>
            <option value="month1">1 month</option>
            <option value="month3">3 months</option>
            <option value="month6">6 months</option>
            <option value="year1">1 year</option>
            <option value="years7">Last 7 years</option>
            <option value="lifetime">Lifetime</option>
            <option value="custom">Custom dates</option>
          </select>
          {showCustomDates && (
            <>
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange((current) => ({ ...current, start: e.target.value, mode: "custom" }))} />
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange((current) => ({ ...current, end: e.target.value, mode: "custom" }))} />
            </>
          )}
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            {["All branches", ...branches].map((b) => <option key={b} value={b}>{b === "All branches" ? "Surya - all branches" : b}</option>)}
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {["All departments", ...departments].map((b) => <option key={b}>{b}</option>)}
          </select>
          <select value={doctor} onChange={(e) => setDoctor(e.target.value)}>
            {["All doctors", ...doctors].map((b) => <option key={b}>{b}</option>)}
          </select>
          <span className="sync"><CalendarDays size={15} />Last sync 04 May 2026, 14:20</span>
          <Badge tone="demo">Demo Mode</Badge>
        </header>
        {topNotification && (
          <div className={`top-notification ${topNotification.tone}`}>
            <Bell size={18} />
            <div>
              <strong>{topNotification.title}</strong>
              <span>{topNotification.body}</span>
            </div>
          </div>
        )}

        <div className="content">
          <WorkflowStrip active={active} setActive={setActive} />
          {active === "Overview" && <Overview data={{ ...data, conversations: allConversations }} totals={totals} filters={filters} backendHealth={backendHealth} onExport={() => exportData("overview", { totals, backendHealth, conversations: allConversations.length })} onSimulate={simulateTelegramCase} />}
          {active === "Parent Circle" && <ParentCircle conversations={filteredConversations} selected={selectedConversation} setSelected={(c) => { setSelectedConversation(c); setDraft(c.aiDraft); }} draft={draft} setDraft={setDraft} approveDraft={approveDraft} search={search} setSearch={setSearch} feedback={feedback} backendHealth={backendHealth} refreshBackend={refreshBackend} onFilter={showFilters} onGenerateDraft={generateDraftForSelected} onSimulate={simulateTelegramCase} onExport={() => exportData("parent-circle", filteredConversations)} />}
          {active === "Doctor Review Queue" && <DoctorQueue conversations={allConversations} selected={selectedConversation} setSelected={(c) => { setSelectedConversation(c); setDraft(c.aiDraft); }} draft={draft} setDraft={setDraft} approveDraft={approveDraft} feedback={feedback} onGenerateDraft={generateDraftForSelected} onExport={() => exportData("doctor-review-queue", feedback)} />}
          {active === "Revenue Recovery" && <RevenueRecovery data={data} totals={totals} prescriptions={prescriptions} search={search} setSearch={setSearch} onFilter={showFilters} onCreateTask={createRecoveryTask} onTaskAction={updateRecoveryTask} onExport={() => exportData("revenue-recovery", { totals, tasks: data.recoveryTasks })} />}
          {active === "Prescription Intelligence" && <PrescriptionIntelligence prescriptions={prescriptions} search={search} setSearch={setSearch} onFilter={showFilters} onMockUpload={mockUploadPrescription} onOcrUpload={ocrUploadPrescription} onExport={() => exportData("prescription-intelligence", prescriptions)} />}
          {active === "Test Leakage" && <TestLeakage tests={testsFiltered} tasks={data.recoveryTasks} search={search} setSearch={setSearch} onFilter={showFilters} onSendLabFollowUp={sendLabFollowUp} onTaskAction={updateRecoveryTask} onExport={() => exportData("test-leakage", testsFiltered)} />}
          {active === "Command Centre" && <CommandCentre data={{ ...data, appointments: filteredAppointments, calls: filteredCalls }} totals={totals} filters={filters} search={search} setSearch={setSearch} onFilter={showFilters} onExport={() => exportData("command-centre", { totals, appointments: filteredAppointments.length, calls: filteredCalls.length, filters })} />}
          {active === "Data Imports" && <DataImports imports={data.imports} onRunImport={runImport} onUploadImport={uploadImportFile} onExport={() => exportData("data-imports", data.imports)} />}
          {active === "Settings / Governance" && <Governance feedback={feedback} settings={governanceSettings} setSettings={setGovernanceSettings} notify={notify} onExport={() => exportData("governance-audit", { feedback, governanceSettings })} />}
        </div>
        <GuideAssistant open={guideOpen} setOpen={setGuideOpen} active={active} setActive={setActive} onSimulate={simulateTelegramCase} onCreateTask={createRecoveryTask} onImport={() => setActive("Data Imports")} />
      </main>
    </div>
  );
}

function WorkflowStrip({ active, setActive }) {
  const steps = [
    { label: "Listen", detail: "Telegram intake", target: "Parent Circle", icon: MessageCircle },
    { label: "Review", detail: "Doctor approval", target: "Doctor Review Queue", icon: Stethoscope },
    { label: "Recover", detail: "Leakage tasks", target: "Revenue Recovery", icon: WalletCards },
    { label: "Lead", detail: "Command centre", target: "Command Centre", icon: BarChart3 }
  ];
  return (
    <div className="workflow-strip">
      {steps.map(({ label, detail, target, icon: Icon }, index) => (
        <button key={label} className={active === target ? "active" : ""} onClick={() => setActive(target)}>
          <span>{index + 1}</span>
          <Icon size={18} />
          <strong>{label}</strong>
          <small>{detail}</small>
        </button>
      ))}
    </div>
  );
}

function GuideAssistant({ open, setOpen, active, setActive, onSimulate, onCreateTask, onImport }) {
  return (
    <div className={`guide-assistant ${open ? "open" : ""}`}>
      <button className="guide-toggle" onClick={() => setOpen(!open)}><Sparkles size={18} />Guide</button>
      {open && (
        <div className="guide-panel">
          <strong>Surya PoC guide</strong>
          <p>Start with a parent message, review the AI draft, recover leakage, then show leadership the command centre.</p>
          <button className="btn primary" onClick={onSimulate}>1. Create parent case</button>
          <button className="btn secondary" onClick={() => setActive("Doctor Review Queue")}>2. Review doctor queue</button>
          <button className="btn secondary" onClick={onCreateTask}>3. Create recovery task</button>
          <button className="btn secondary" onClick={() => setActive("Command Centre")}>4. Open command centre</button>
          <button className="btn ghost" onClick={onImport}>Import data</button>
          <span>Current screen: {active}</span>
        </div>
      )}
    </div>
  );
}

function Overview({ data, totals, backendHealth, onExport, onSimulate }) {
  const health = 84;
  return (
    <>
      <SectionHeader eyebrow="Integrated executive demo" title="Surya Integrated Growth & Care PoC Suite" subtitle="A thin command layer for Telegram pediatric engagement, leakage recovery, and leadership visibility across Caresoft, CRM, WebEngage, pharmacy, lab, billing, and call centre systems." onExport={onExport} />
      <div className="hero-actions">
        <button className="btn primary" onClick={onSimulate}><MessageCircle size={16} />Simulate Telegram fever case</button>
        <button className="btn secondary" onClick={onExport}><Download size={16} />Export overview pack</button>
      </div>
      <div className="grid cards-4">
        <Card title="Parent conversations" value={data.conversations.length} sub="700 generated + live Telegram" icon={MessageCircle} />
        <Card title="Pharmacy leakage" value={money(totals.pharmacyLeakage)} sub="2,200 prescribed medicine rows" icon={Pill} />
        <Card title="Test leakage" value={money(totals.testLeakage)} sub="40 missed or pending tests" icon={Microscope} />
        <Card title="Leadership health score" value={`${health}/100`} sub="weighted multi-system score" icon={Activity} />
      </div>
      <div className="grid cards-4">
        <Card title="Backend API" value={backendHealth?.ok ? "Online" : "Offline"} sub="Local Express service" icon={Database} />
        <Card title="Telegram bot" value={backendHealth?.telegramPolling ? "Polling" : "Waiting"} sub="@suryahealthbot" icon={MessageCircle} />
        <Card title="Groq AI" value={backendHealth?.groqConfigured ? "Configured" : "Missing"} sub="Draft generation only" icon={Brain} />
        <Card title="Live Telegram cases" value={backendHealth?.liveTelegramConversations || 0} sub="doctor-review queue" icon={Inbox} />
      </div>
      <div className="demo-flow">
        {["Parent sends Telegram fever query", "AI extracts symptoms and red flags", "Doctor edits and approves", "Approved draft sends to Telegram", "Leakage tasks generated", "Leadership sees one command centre"].map((step, i) => (
          <div className="flow-step" key={step}><span>{i + 1}</span><strong>{step}</strong><ChevronRight size={16} /></div>
        ))}
      </div>
      <div className="grid two">
        <Panel title="PoC safety posture" icon={ShieldCheck}>
          {["AI-generated clinical drafts are never sent automatically.", "Doctor or care coordinator approval is required before final sending.", "Emergency red flags override scoring and force escalation.", "The system does not diagnose, prescribe, or suggest antibiotics.", "All edits, approvals, escalations, and unsafe markings are logged."].map((x) => <div className="check-row" key={x}><CheckCircle2 size={16} />{x}</div>)}
        </Panel>
        <Panel title="Integration-shaped data model" icon={Database}>
          {["Patient", "RelatedPerson / Parent Guardian", "Encounter / Visit", "Appointment", "MedicationRequest / Prescription", "MedicationDispense / Pharmacy Sale", "ServiceRequest / Test Order", "DiagnosticReport", "Observation", "Communication", "Task", "AuditEvent", "Consent"].map((x) => <Badge key={x}>{x}</Badge>)}
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, icon: Icon, children }) {
  return <section className="panel"><div className="panel-title">{Icon && <Icon size={18} />}<h2>{title}</h2></div>{children}</section>;
}

function ParentCircle({ conversations, selected, setSelected, draft, setDraft, approveDraft, search, setSearch, feedback, backendHealth, refreshBackend, onFilter, onGenerateDraft, onSimulate, onExport }) {
  const [tab, setTab] = useState("inbox");
  return (
    <>
      <SectionHeader eyebrow="Surya Parent Circle" title="Telegram + AI Pediatric Community Inbox" subtitle="AI classifies, extracts, drafts, and routes. Doctors retain control over clinical responses." onExport={onExport} />
      <div className="tab-bar">
        <button className={tab === "inbox" ? "active" : ""} onClick={() => setTab("inbox")}><Inbox size={15} />Inbox ({conversations.length})</button>
        <button className={tab === "broadcasts" ? "active" : ""} onClick={() => setTab("broadcasts")}><Bell size={15} />Community broadcasts</button>
      </div>
      {tab === "inbox" && (
        <>
          <SearchFilter search={search} setSearch={setSearch} onFilter={onFilter}>
            <button className="btn primary" onClick={refreshBackend}><Sparkles size={16} />Refresh Telegram</button>
            <button className="btn secondary" onClick={onGenerateDraft}><Brain size={16} />Generate draft</button>
            <button className="btn secondary" onClick={onSimulate}><MessageCircle size={16} />Simulate case</button>
          </SearchFilter>
          <div className="telegram-status">
            <Badge tone={backendHealth?.telegramPolling ? "good" : "warn"}>{backendHealth?.telegramPolling ? "Telegram polling live" : "Telegram waiting"}</Badge>
            <span>@suryahealthbot · AI drafts held for review · {backendHealth?.liveTelegramConversations || 0} live conversation{backendHealth?.liveTelegramConversations === 1 ? "" : "s"}</span>
          </div>
          <div className="parent-layout">
            <section className="inbox-list">
              {conversations.length === 0 ? <EmptyState /> : conversations.slice(0, 28).map((c) => (
                <button className={`inbox-item ${selected?.id === c.id ? "selected" : ""}`} key={c.id} onClick={() => setSelected(c)}>
                  <div><strong>{c.parentName}</strong><span>{c.receivedAt}</span></div>
                  <p>{c.childName}, {c.childAge}</p>
                  <small>{c.preview}</small>
                  <div className="badge-line"><Badge tone={c.urgency.includes("Emergency") ? "danger" : c.urgency.includes("Urgent") ? "warn" : "neutral"}>{c.urgency}</Badge><Badge>{c.topic}</Badge><Badge>{c.confidence}% AI</Badge></div>
                </button>
              ))}
            </section>
            {selected && <Conversation selected={selected} draft={draft} setDraft={setDraft} approveDraft={approveDraft} feedback={feedback} />}
          </div>
        </>
      )}
      {tab === "broadcasts" && <CommunityBroadcasts conversations={conversations} onExport={onExport} />}
    </>
  );
}

function Conversation({ selected, draft, setDraft, approveDraft, feedback }) {
  const [showProfile, setShowProfile] = useState(false);
  return (
    <div className="conversation-grid">
      {showProfile && <ParentProfileModal selected={selected} onClose={() => setShowProfile(false)} />}
      <Panel title={`${selected.childName} — conversation thread`} icon={MessageCircle}>
        <div className="chat">
          {selected.parentMessages.map((m, i) => <div key={i} className={`bubble ${m.from}`}>{m.text}<span>{m.time}{m.draft ? " · AI draft" : ""}</span></div>)}
          <div className="bubble surya">{draft}<span>Doctor-reviewable draft — not sent yet</span></div>
        </div>
      </Panel>
      <Panel title="Safety Snapshot" icon={AlertTriangle}>
        <dl className="snapshot">
          <dt>Child age</dt><dd>{selected.childAge}</dd>
          <dt>Temperature</dt><dd>{selected.temperature || selected.preview.match(/\d{2,3}(?:\.\d)?\s?F/)?.[0] || "Not captured"}</dd>
          <dt>Symptoms extracted</dt><dd>{selected.symptoms.join(", ")}</dd>
          <dt>Red flags detected</dt><dd style={{ color: selected.redFlags.length ? "#a83125" : undefined }}>{selected.redFlags.length ? selected.redFlags.join(", ") : "None detected"}</dd>
          <dt>Missing information</dt><dd>{selected.missing.join(", ")}</dd>
          <dt>Suggested routing</dt><dd><Badge tone={selected.urgency.includes("Emergency") ? "danger" : selected.urgency.includes("Urgent") ? "warn" : "neutral"}>{selected.urgency}</Badge></dd>
        </dl>
      </Panel>
      <Panel title="AI Draft Panel" icon={Brain}>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
        <div className="action-row wrap">
          <button className="btn primary" onClick={() => approveDraft(selected.source === "telegram-live" ? "Approved + Send" : "Approved")}><CheckCircle2 size={16} />{selected.source === "telegram-live" ? "Approve + send" : "Approve"}</button>
          <button className="btn secondary" onClick={() => approveDraft("Edited + Approved")}><FileText size={16} />Save edit</button>
          <button className="btn danger" onClick={() => approveDraft("Emergency Escalated")}><AlertTriangle size={16} />Escalate</button>
        </div>
        <div className="rules-mini">Never diagnose · Never prescribe · No antibiotics · Doctor review required · Audit logged</div>
        <div className="feedback-note">{feedback.length} doctor edit training example{feedback.length === 1 ? "" : "s"} saved.</div>
      </Panel>
      <Panel title="Parent Profile" icon={Users}>
        <div className="profile-grid">
          <span>Parent</span><strong>{selected.parentName}</strong>
          <span>Telegram</span><strong>{selected.telegramHandle || "Demo handle"}</strong>
          <span>Consent</span><Badge tone={selected.consent === "Opted in" ? "good" : "warn"}>{selected.consent}</Badge>
          <span>Language</span><strong>{selected.language}</strong>
          <span>Vaccination reminders</span><strong>2 due this month</strong>
          <span>Engagement score</span><strong>{72 + (selected.id.charCodeAt(4) % 20)}/100</strong>
        </div>
        <div className="action-row" style={{ marginTop: 14 }}>
          <button className="btn secondary" onClick={() => setShowProfile(true)}><Users size={15} />View full profile</button>
        </div>
      </Panel>
      <Panel title="Approved Community Broadcasts" icon={Bell}>
        {["Fever basics", "Vaccination reminders", "Nutrition tips", "Monsoon illness awareness", "Newborn care", "When to visit emergency"].map((b) => (
          <div className="broadcast" key={b}><strong>{b}</strong><Badge tone="good">Opt-in + approved</Badge></div>
        ))}
      </Panel>
    </div>
  );
}

function DoctorQueue({ conversations, selected, setSelected, draft, setDraft, approveDraft, feedback, onGenerateDraft, onExport }) {
  const queue = conversations.filter((c) => ["AI Drafted", "In Review", "Escalated"].includes(c.status)).slice(0, 18);
  return (
    <>
      <SectionHeader eyebrow="Clinical oversight" title="Doctor Review Queue" subtitle="Review, edit, approve, escalate, convert to appointment, or save FAQ candidates. Edits are stored as future tone examples." onExport={onExport} />
      <div className="queue-layout">
        <Panel title="Pending clinical review" icon={Stethoscope}>
          <table><thead><tr><th>Case</th><th>Urgency</th><th>Reviewer</th><th>Status</th><th>AI</th></tr></thead><tbody>
            {queue.map((c) => <tr key={c.id} onClick={() => setSelected(c)}><td><strong>{c.childName}</strong><span>{c.preview}</span></td><td><Badge tone={c.urgency === "Emergency" ? "danger" : "warn"}>{c.urgency}</Badge></td><td>{c.reviewer}</td><td>{c.status}</td><td>{c.confidence}%</td></tr>)}
          </tbody></table>
        </Panel>
        <Panel title="Reviewer workspace" icon={ClipboardCheck}>
          <strong>{selected.childName} - {selected.childAge}</strong>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="action-row wrap">
            <button className="btn primary" onClick={() => approveDraft(selected.source === "telegram-live" ? "Approved + Send" : "Approved")}>{selected.source === "telegram-live" ? "Approve + send Telegram" : "Approve draft"}</button>
            <button className="btn secondary" onClick={onGenerateDraft}>Regenerate draft</button>
            <button className="btn secondary" onClick={() => approveDraft("Edited + Approved")}>Edit + approve</button>
            <button className="btn danger" onClick={() => approveDraft("Emergency Escalated")}>Escalate emergency</button>
            <button className="btn secondary" onClick={() => approveDraft("Appointment Request")}>Convert appointment</button>
            <button className="btn secondary" onClick={() => approveDraft("Call-back Task")}>Call-back task</button>
            <button className="btn secondary" onClick={() => approveDraft("FAQ Candidate")}>FAQ candidate</button>
            <button className="btn ghost" onClick={() => approveDraft("Unsafe Draft")}>Mark unsafe</button>
          </div>
          <div className="audit-list">
            {feedback.slice(0, 4).map((f) => <div key={f.id}><Badge>{f.action}</Badge><span>{f.reviewer} - {f.at} - {f.conversationId}</span></div>)}
          </div>
        </Panel>
      </div>
    </>
  );
}

function RevenueRecovery({ data, totals, prescriptions, search, setSearch, onFilter, onCreateTask, onTaskAction, onExport }) {
  const [tab, setTab] = useState("overview");
  const trend = ["May 1", "May 2", "May 3", "May 4"].map((d, i) => ({ d, pharmacy: 62 + i * 5, tests: 55 + i * 4 }));
  const deptLeak = departments.map((d, i) => ({ name: d, value: 50000 + i * 18000 }));
  return (
    <>
      <SectionHeader eyebrow="Revenue Recovery Engine" title="Prescription, Pharmacy, and Test Leakage" subtitle="Identifies continuity gaps from doctor orders and creates respectful follow-up tasks." onExport={onExport} />
      <div className="tab-bar">
        <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}><BarChart3 size={15} />Overview</button>
        <button className={tab === "pharmacy" ? "active" : ""} onClick={() => setTab("pharmacy")}><Pill size={15} />Pharmacy conversion</button>
        <button className={tab === "tasks" ? "active" : ""} onClick={() => setTab("tasks")}><ClipboardCheck size={15} />Recovery tasks ({data.recoveryTasks.filter(t => t.status !== "Converted after follow-up").length} open)</button>
      </div>
      {tab === "overview" && (
        <>
          <SearchFilter search={search} setSearch={setSearch} onFilter={onFilter}><button className="btn primary" onClick={onCreateTask}><Users size={16} />Create recovery task</button></SearchFilter>
          <div className="grid cards-4">
            <Card title="Total prescribed medicine value" value={money(totals.prescribedValue)} icon={Pill} />
            <Card title="Pharmacy captured" value={money(totals.captured)} icon={CheckCircle2} />
            <Card title="Estimated pharmacy leakage" value={money(totals.pharmacyLeakage)} icon={AlertTriangle} tone="warm" />
            <Card title="Recovery value this week" value={money(totals.recoveryValue)} icon={WalletCards} />
            <Card title="Tests ordered" value={totals.testsOrdered} icon={Microscope} />
            <Card title="Tests completed at Surya" value={totals.testsCompleted} icon={ClipboardCheck} />
            <Card title="Estimated test leakage" value={money(totals.testLeakage)} icon={AlertTriangle} tone="warm" />
            <Card title="Recovery tasks open" value={data.recoveryTasks.filter((t) => t.status !== "Converted after follow-up").length} icon={Users} />
          </div>
          <div className="grid two">
            <Panel title="Capture rate over time" icon={BarChart3}><ChartLine data={trend} /></Panel>
            <Panel title="Leakage by department" icon={Activity}><ChartBar data={deptLeak} /></Panel>
          </div>
          <RecoveryTasks tasks={data.recoveryTasks} onTaskAction={onTaskAction} />
        </>
      )}
      {tab === "pharmacy" && (
        <>
          <SearchFilter search={search} setSearch={setSearch} onFilter={onFilter} />
          <PharmacyConversion prescriptions={prescriptions || []} search={search} onExport={onExport} />
        </>
      )}
      {tab === "tasks" && (
        <>
          <SearchFilter search={search} setSearch={setSearch} onFilter={onFilter}><button className="btn primary" onClick={onCreateTask}><Users size={16} />Create recovery task</button></SearchFilter>
          <RecoveryTasks tasks={data.recoveryTasks} onTaskAction={onTaskAction} />
        </>
      )}
    </>
  );
}

function PrescriptionIntelligence({ prescriptions, search, setSearch, onFilter, onMockUpload, onOcrUpload, onExport }) {
  return (
    <>
      <SectionHeader eyebrow="Prescription Intelligence" title="Scanned Prescription Extraction and Pharmacy Conversion" subtitle="Image and PDF OCR with confidence scoring, SKU matching, and human review for low-confidence prescriptions." onExport={onExport} />
      <SearchFilter search={search} setSearch={setSearch} onFilter={onFilter}>
        <label className="btn primary file-btn"><Upload size={16} />AI OCR upload<input type="file" accept="image/*,.pdf" onChange={(e) => onOcrUpload(e.target.files?.[0])} /></label>
        <button className="btn secondary" onClick={onMockUpload}><Upload size={16} />Use sample prescription</button>
      </SearchFilter>
      <Panel title="Prescription review worklist" icon={Pill}>
        {prescriptions.length === 0 ? <EmptyState /> : <table><thead><tr><th>Prescription</th><th>Extracted medicines</th><th>Conversion</th><th>Confidence</th><th>Human review</th></tr></thead><tbody>
          {prescriptions.slice(0, 22).map((p) => {
            const lost = p.medicines.filter((m) => !p.purchased.some((x) => x.name === m.name));
            return <tr key={p.id}><td><div className="rx-cell"><div className="rx-thumb">RX</div><div><strong>{p.id} - {p.uhid}</strong><span>{p.patient} - {p.doctor} - {p.date}</span>{p.sourceFile && <span>Uploaded file: {p.sourceFile}</span>}{p.ocrNotes && <span>{p.ocrNotes}</span>}</div></div></td><td>{p.medicines.map((m) => m.name).join(", ")}</td><td><Badge tone={p.status === "Fully captured" ? "good" : p.status === "Not captured" ? "danger" : "warn"}>{p.status}</Badge><span className="muted">{lost.length ? ` ${lost.length} not purchased` : " all items captured"}</span></td><td>{p.confidence}%</td><td><Badge tone={p.reviewStatus.includes("Required") ? "warn" : "good"}>{p.reviewStatus}</Badge></td></tr>;
          })}
        </tbody></table>}
      </Panel>
      <Panel title="Extraction confidence model" icon={Brain}>
        {["Medicine name / SKU match 30%", "Dosage + strength 20%", "Frequency and duration 15%", "Patient and visit linkage 15%", "Doctor and department linkage 10%", "Special instructions 10%"].map((x) => <Badge key={x}>{x}</Badge>)}
      </Panel>
    </>
  );
}

function TestLeakage({ tests, tasks, search, setSearch, onFilter, onSendLabFollowUp, onTaskAction, onExport }) {
  const pendingTests = tests.filter((test) => test.status !== "Completed");
  const [selectedId, setSelectedId] = useState(pendingTests[0]?.id || "");
  const selected = pendingTests.find((test) => test.id === selectedId) || pendingTests[0];
  const [channel, setChannel] = useState("Telegram");
  const [message, setMessage] = useState("Hello, this is Surya Hospitals. The doctor had advised this test during your visit. Would you like help with booking, timing, or sample collection?");
  return (
    <>
      <SectionHeader eyebrow="Lab continuity" title="Test Leakage View" subtitle="Compares ServiceRequest-style test orders against billing, sample collection, and DiagnosticReport completion." onExport={onExport} />
      <SearchFilter search={search} setSearch={setSearch} onFilter={onFilter}><button className="btn primary" onClick={() => onSendLabFollowUp(selected, message, channel)}>Send lab follow-up</button></SearchFilter>
      <Panel title="Choose test follow-up recipient" icon={MessageCircle}>
        <div className="followup-composer">
          <select value={selected?.id || ""} onChange={(e) => setSelectedId(e.target.value)}>
            {pendingTests.slice(0, 40).map((test) => <option key={test.id} value={test.id}>{test.patient} - {test.test} - {test.uhid}</option>)}
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option>Telegram</option>
            <option>Call centre task</option>
            <option>Care coordinator queue</option>
          </select>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="rules-mini">Sends to a mock guardian contact for the selected UHID. Real outbound channels would connect to Telegram/CRM after consent checks.</div>
        </div>
      </Panel>
      <Panel title="Ordered tests and completion status" icon={Microscope}>
        {tests.length === 0 ? <EmptyState /> : <table><thead><tr><th>Test order</th><th>Billing</th><th>Sample</th><th>Report</th><th>Status</th><th>Value</th><th>Follow-up</th></tr></thead><tbody>
          {tests.slice(0, 28).map((t) => <tr key={t.id}><td><strong>{t.test}</strong><span>{t.uhid} - {t.doctor} - {t.date}</span></td><td>{t.billed ? "Billed" : "Not billed"}</td><td>{t.collected ? "Collected" : "Pending"}</td><td>{t.report ? "Generated" : "Pending"}</td><td><Badge tone={t.status === "Completed" ? "good" : t.status.includes("not") ? "danger" : "warn"}>{t.status}</Badge></td><td>{money(t.value)}</td><td>{t.followUp}</td></tr>)}
        </tbody></table>}
      </Panel>
      <RecoveryTasks tasks={tasks.filter((t) => t.leakageType === "Test order")} onTaskAction={onTaskAction} />
    </>
  );
}

function RecoveryTasks({ tasks, onTaskAction }) {
  return (
    <Panel title="Recovery task queue and safe follow-up scripts" icon={ClipboardCheck}>
      <table><thead><tr><th>Priority</th><th>Patient</th><th>Leakage</th><th>Value</th><th>Due</th><th>Assigned</th><th>Suggested script</th><th>Action</th></tr></thead><tbody>
        {tasks.slice(0, 12).map((t) => <tr key={t.id}><td><Badge tone={t.priority === "Critical" ? "danger" : t.priority === "High" ? "warn" : "neutral"}>{t.priority}</Badge></td><td><strong>{t.patient}</strong><span>{t.contact}</span></td><td>{t.leakageType}<span>{t.clinicalImportance}</span></td><td>{money(t.value)}</td><td>{t.due}</td><td>{t.assigned}</td><td className="script">{t.script}</td><td><button className="btn mini" onClick={() => onTaskAction?.(t.id, t.status === "Converted after follow-up" ? "Follow-up sent" : "Converted after follow-up")}>{t.status === "Converted after follow-up" ? "Reopen" : "Convert"}</button></td></tr>)}
      </tbody></table>
      <div className="rules-mini">Script rules: care continuity, not sales pressure - respect opt-out - avoid sensitive detail unless consent exists.</div>
    </Panel>
  );
}

function CommandCentre({ data, totals, filters, search, setSearch, onFilter, onExport }) {
  const opTrend = ["May 1", "May 2", "May 3", "May 4"].map((d, i) => ({ d, revenue: 32 + i * 6, opd: 210 + i * 28, calls: 140 + i * 18 }));
  const pincode = pinCodes.map((p, i) => ({ name: p, value: 40 + i * 7 }));

  // Derived metrics from real mock data
  const arrivedAppts = data.appointments.filter(a => a.status === "Arrived").length;
  const noShows = data.appointments.filter(a => a.status === "No-show").length;
  const noShowRate = data.appointments.length ? Math.round((noShows / data.appointments.length) * 100) : 0;
  const callConversion = Math.round((data.calls.filter(c => c.converted).length / Math.max(1, data.calls.length)) * 100);
  const inboundCalls = data.calls.filter(c => c.type === "Inbound").length;
  const missedCalls = data.calls.filter(c => c.type === "Missed").length;
  const unloggedCalls = data.calls.filter(c => c.type === "Unlogged").length;
  const avgResponseMin = Math.round(data.calls.reduce((a, c) => a + c.responseMin, 0) / Math.max(1, data.calls.length));
  const pharmacyCaptureRate = Math.round((totals.captured / Math.max(1, totals.prescribedValue)) * 100);
  const testCompletionRate = Math.round((totals.testsCompleted / Math.max(1, totals.testsOrdered)) * 100);
  const doctorRevenue = doctors.map((d, i) => ({ name: d.replace("Dr. ", ""), value: 280000 + i * 65000 }));

  return (
    <>
      <SectionHeader eyebrow="Surya Command Centre" title="Leadership Dashboard Across Systems" subtitle="A thin executive layer above Caresoft, LeadSquared, WebEngage, pharmacy, lab, billing, and call centre data." onExport={onExport} />
      <SearchFilter search={search} setSearch={setSearch} onFilter={onFilter}>
        <Badge tone="good">{filters.branch === "All branches" ? "All branches" : filters.branch}</Badge>
        <Badge>{filters.dateRange.mode}</Badge>
      </SearchFilter>
      <div className="grid cards-5">
        <Card title="Today's revenue" value="Rs 42.8L" sub="Caresoft aggregate (mock)" icon={WalletCards} />
        <Card title="OPD arrived" value={arrivedAppts} sub={`${data.appointments.length} total booked · ${noShowRate}% no-show`} icon={Users} />
        <Card title="IPD count" value={Math.round(arrivedAppts * 0.22)} sub="22% admission rate (mock)" icon={Hospital} />
        <Card title="Bed occupancy" value="81%" sub="Clinical ops data (mock)" icon={Activity} />
        <Card title="ICU census" value="18 beds" sub="Critical care (mock)" icon={HeartPulse} />
        <Card title="Pharmacy capture" value={`${pharmacyCaptureRate}%`} sub="From prescription data" icon={Pill} />
        <Card title="Test completion" value={`${testCompletionRate}%`} sub={`${totals.testsCompleted} of ${totals.testsOrdered} tests`} icon={Microscope} />
        <Card title="Call-to-appointment" value={`${callConversion}%`} sub={`${data.calls.length} calls tracked`} icon={Bell} />
        <Card title="Repeat family visits" value="1,284" sub="Surya-loyal families (mock)" icon={Users} />
        <Card title="Data sync health" value="91%" sub="8 of 10 systems mapped" icon={Database} />
      </div>
      <div className="grid two">
        <Panel title="Revenue, OPD, and call trend — May 2026" icon={BarChart3}><ChartLine data={opTrend} /></Panel>
        <Panel title="Pin-code patient volume — directional" icon={Building2}><ChartBar data={pincode} /></Panel>
      </div>
      <div className="grid two">
        <Panel title="Doctor-wise revenue contribution (mock)" icon={BarChart3}><ChartBar data={doctorRevenue} /></Panel>
        <CampaignCalendar />
      </div>
      <div className="command-sections">
        <MiniDashboard title="Operations" items={[`OPD arrived ${arrivedAppts}`, "Bed occupancy 81%", "ICU census 18", `Avg wait ${avgResponseMin} min`, `No-show rate ${noShowRate}%`]} />
        <MiniDashboard title="Revenue" items={["Daily revenue Rs 42.8L", "Pharmacy Rs 7.2L", "Lab / Radiology Rs 5.6L", `Leakage pending ${money(totals.testLeakage + totals.pharmacyLeakage)}`, "Recovered this week Rs 4.8L"]} />
        <MiniDashboard title="Marketing and Pin Code" items={["Directional correlation only — not attribution", "Camp lift +18% (Apr camp)", "High pediatric demand pin 400071", "ENT demand rising pin 401107", "Doctor demand visible by area"]} />
        <MiniDashboard title="Call Centre" items={[`Inbound calls ${inboundCalls}`, `Missed calls ${missedCalls}`, `Unlogged calls ${unloggedCalls}`, "High-intent leads pending 38", `Avg response ${avgResponseMin} min`]} />
        <MiniDashboard title="Retention and Family Continuity" items={["Repeat families 1,284", "Returning pediatric patients 742", "Doctor-attached 61%", "Surya-attached 39%", "Drop-off risk 96 families"]} />
        <MiniDashboard title="Data Quality" items={["Missing UHID 41", "Duplicate patients 22", "Unmapped medicines 18", "Unmapped tests 9", "Consent missing 34"]} />
      </div>
      <Panel title="Filtered leadership worklist" icon={Database}>
        <table><thead><tr><th>Signal</th><th>Scope</th><th>Owner</th><th>Status</th><th>Next action</th></tr></thead><tbody>
          {[
            ["OPD arrivals", `${arrivedAppts} arrived · ${noShows} no-shows`, "Operations", "Live", "Review no-shows by doctor"],
            ["Call centre", `${data.calls.length} calls · ${callConversion}% conversion`, "Access team", "Live", "Call high-intent leads"],
            ["Pharmacy leakage", money(totals.pharmacyLeakage), "Pharmacy manager", "Open", "Create recovery tasks"],
            ["Test leakage", money(totals.testLeakage), "Lab manager", "Open", "Send follow-ups"],
            ["Data quality", "Missing UHID / consent", "Admin", "Needs review", "Run imports"]
          ].filter((row) => row.join(" ").toLowerCase().includes(search.toLowerCase())).map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td><Badge tone={row[3] === "Live" ? "good" : "warn"}>{row[3]}</Badge></td><td>{row[4]}</td></tr>)}
        </tbody></table>
      </Panel>
    </>
  );
}

function MiniDashboard({ title, items }) {
  return <Panel title={title} icon={Activity}>{items.map((x) => <div className="mini-row" key={x}><span>{x}</span><Badge>Live mock</Badge></div>)}</Panel>;
}

function DataImports({ imports, onRunImport, onUploadImport, onExport }) {
  const [target, setTarget] = useState(imports[0]?.name || "");
  return (
    <>
      <SectionHeader eyebrow="Integration layer" title="Data Imports" subtitle="Mock upload cards for future integrations with Caresoft, billing, pharmacy, lab, appointment, call centre, CRM, campaigns, and Telegram exports." onExport={onExport} />
      <div className="import-bar">
        <Database size={20} />
        <select value={target} onChange={(e) => setTarget(e.target.value)}>{imports.map((imp) => <option key={imp.name}>{imp.name}</option>)}</select>
        <label className="btn primary file-btn"><Upload size={16} />Import selected file<input type="file" accept=".csv,.tsv,.txt,.json" onChange={(e) => onUploadImport(target, e.target.files?.[0])} /></label>
      </div>
      <div className="import-grid">
        {imports.map((imp) => <div className="import-card" key={imp.name}><div><Database size={20} /><strong>{imp.name}</strong></div><span>{imp.file}</span><div className="import-stats"><Badge>{imp.imported} imported</Badge><Badge tone={imp.failed ? "warn" : "good"}>{imp.failed} failed</Badge><Badge tone={imp.mapping === "Mapped" ? "good" : "warn"}>{imp.mapping}</Badge></div><p>Last imported {imp.last}</p><div className="quality"><span style={{ width: `${imp.quality}%` }} /></div><small>Data quality score {imp.quality}%</small><div className="action-row wrap"><button className="btn secondary" onClick={() => onRunImport(imp.name)}><Upload size={16} />Run import</button><label className="btn primary file-btn"><Upload size={16} />Upload file<input type="file" accept=".csv,.tsv,.txt,.json" onChange={(e) => onUploadImport(imp.name, e.target.files?.[0])} /></label></div></div>)}
      </div>
    </>
  );
}

function Governance({ feedback, settings, setSettings, notify, onExport }) {
  function update(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    notify("Governance setting updated", `${key} changed.`, "good");
  }
  return (
    <>
      <SectionHeader eyebrow="Governance and safety" title="Settings / Governance" subtitle="Policies, approval gates, escalation rules, role mockups, and audit logs for a doctor-reviewed AI workflow." onExport={onExport} />
      <div className="grid two">
        <Panel title="Configurable governance controls" icon={Settings}>
          <div className="settings-grid">
            <label><span>Doctor approval required</span><input type="checkbox" checked={settings.doctorApproval} onChange={(e) => update("doctorApproval", e.target.checked)} /></label>
            <label><span>Emergency escalation</span><input type="checkbox" checked={settings.emergencyEscalation} onChange={(e) => update("emergencyEscalation", e.target.checked)} /></label>
            <label><span>Community broadcasts enabled</span><input type="checkbox" checked={settings.communityBroadcasts} onChange={(e) => update("communityBroadcasts", e.target.checked)} /></label>
            <label><span>Retention months</span><input type="number" min="3" max="84" value={settings.retentionMonths} onChange={(e) => update("retentionMonths", Number(e.target.value))} /></label>
            <label><span>Default role</span><select value={settings.defaultRole} onChange={(e) => update("defaultRole", e.target.value)}>{["Admin", "Doctor reviewer", "Care coordinator", "Pharmacy manager", "Lab manager", "Marketing manager", "Leadership viewer"].map((role) => <option key={role}>{role}</option>)}</select></label>
            <label><span>Consent mode</span><select value={settings.consentMode} onChange={(e) => update("consentMode", e.target.value)}><option>Opt-in required</option><option>Care-context only</option><option>Broadcasts disabled</option></select></label>
          </div>
        </Panel>
        <Panel title="AI safety rules" icon={ShieldCheck}>
          {["Clinical answers require doctor/care coordinator approval.", "Emergency red flags escalate immediately.", "System does not diagnose or prescribe.", "No antibiotic suggestions.", "No dosage unless doctor-approved FAQ content.", "All edits and approvals logged."].map((x) => <div className="check-row" key={x}><CheckCircle2 size={16} />{x}</div>)}
        </Panel>
        <Panel title="Role-based access mockup" icon={Users}>
          {["Admin", "Doctor reviewer", "Care coordinator", "Pharmacy manager", "Lab manager", "Marketing manager", "Leadership viewer"].map((r) => <Badge key={r}>{r}</Badge>)}
        </Panel>
        <Panel title="Consent and Telegram templates" icon={MessageCircle}>
          <div className="template">Opt-in: "I agree to receive Surya care reminders and educational updates on Telegram."</div>
          <div className="template">Opt-out: "Reply STOP anytime to stop non-essential community updates."</div>
          <div className="template">Sensitive details are only used where consent and care context exist.</div>
        </Panel>
        <Panel title="Audit logs" icon={FileText}>
          <div className="audit-list">
            {feedback.length === 0 && <div><Badge>Demo ready</Badge><span>No review actions yet. Approve or edit a draft to create an audit event.</span></div>}
            {feedback.map((f) => <div key={f.id}><Badge>{f.action}</Badge><span>{f.reviewer} - {f.conversationId} - {f.at}</span></div>)}
            <div><Badge>Policy</Badge><span>Data retention mock setting: 24 months for operational audit logs.</span></div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function ChartLine({ data }) {
  return <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="d" /><YAxis /><Tooltip /><Line type="monotone" dataKey={Object.keys(data[0])[1]} stroke="#0e8aa0" strokeWidth={3} dot={false} /><Line type="monotone" dataKey={Object.keys(data[0])[2]} stroke="#3ba37a" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>;
}

function ChartBar({ data }) {
  return <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" radius={[7, 7, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={i % 2 ? "#0e8aa0" : "#7ac6b4"} />)}</Bar></BarChart></ResponsiveContainer></div>;
}

/* ─── Community Broadcasts ─── */
function CommunityBroadcasts({ conversations, onExport }) {
  const [broadcasts, setBroadcasts] = useState([
    { id: "BC-001", topic: "Fever basics", content: "When to give paracetamol, when to visit emergency, and how to monitor temperature at home. Practical guidance for parents.", audience: "All opted-in parents", status: "Sent", optIns: 412, sent: "2026-04-28", engagement: 68 },
    { id: "BC-002", topic: "Vaccination reminders", content: "Your child's upcoming vaccination schedule — what to expect, how to prepare, and when to come in.", audience: "All opted-in parents", status: "Sent", optIns: 389, sent: "2026-04-25", engagement: 72 },
    { id: "BC-003", topic: "Nutrition tips", content: "Age-appropriate nutrition guidelines for toddlers and school-age children. Approved by Surya pediatric team.", audience: "Children under 5 yrs", status: "Approved", optIns: 0, sent: null, engagement: 0 },
    { id: "BC-004", topic: "Monsoon illness awareness", content: "Common monsoon illnesses in children, prevention tips, and when to seek care at Surya.", audience: "All opted-in parents", status: "Draft", optIns: 0, sent: null, engagement: 0 },
    { id: "BC-005", topic: "Newborn care", content: "First week home with a newborn — feeding, sleep, hygiene, and warning signs every parent should know.", audience: "Neonatal parents", status: "Pending approval", optIns: 0, sent: null, engagement: 0 },
    { id: "BC-006", topic: "When to visit emergency", content: "Clear guidance on emergency red-flag symptoms in children. The list every parent should have saved.", audience: "All opted-in parents", status: "Sent", optIns: 502, sent: "2026-04-15", engagement: 81 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newBC, setNewBC] = useState({ topic: "", content: "", audience: "All opted-in parents" });

  const optedIn = conversations.filter(c => c.consent === "Opted in").length;
  const avgEngagement = Math.round(broadcasts.filter(b => b.engagement > 0).reduce((a, b) => a + b.engagement, 0) / Math.max(1, broadcasts.filter(b => b.engagement > 0).length));

  function saveDraft() {
    if (!newBC.topic.trim()) return;
    setBroadcasts(prev => [{ id: `BC-${String(prev.length + 1).padStart(3, "0")}`, ...newBC, status: "Draft", optIns: 0, sent: null, engagement: 0 }, ...prev]);
    setNewBC({ topic: "", content: "", audience: "All opted-in parents" });
    setShowForm(false);
  }

  function updateStatus(id, status, extra = {}) {
    setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, status, ...extra } : b));
  }

  const toneFor = s => ({ Approved: "good", Sent: "good", "Pending approval": "warn", Draft: "neutral" }[s] || "neutral");

  return (
    <>
      <div className="toolbar">
        <span style={{ color: "#5f7780", fontSize: 13 }}><strong>{optedIn.toLocaleString("en-IN")}</strong> opted-in parents · <strong>{avgEngagement}%</strong> avg engagement</span>
        <button className="btn primary" onClick={() => setShowForm(v => !v)}><Bell size={16} />New broadcast draft</button>
        <button className="btn secondary" onClick={onExport}><Download size={16} />Export</button>
      </div>
      {showForm && (
        <Panel title="Draft new broadcast" icon={Bell}>
          <div className="settings-grid">
            <label><span>Topic</span><input value={newBC.topic} onChange={e => setNewBC(b => ({ ...b, topic: e.target.value }))} placeholder="e.g. Summer heat safety tips" /></label>
            <label><span>Target audience</span>
              <select value={newBC.audience} onChange={e => setNewBC(b => ({ ...b, audience: e.target.value }))}>
                <option>All opted-in parents</option>
                <option>Children under 5 yrs</option>
                <option>Neonatal parents</option>
                <option>Vaccination due this month</option>
                <option>Returning families</option>
              </select>
            </label>
            <label style={{ gridColumn: "1 / -1" }}><span>Content — educational only, no clinical advice</span>
              <textarea value={newBC.content} onChange={e => setNewBC(b => ({ ...b, content: e.target.value }))} placeholder="Safe, educational content approved by the Surya pediatric team..." style={{ minHeight: 100 }} />
            </label>
          </div>
          <div className="action-row">
            <button className="btn primary" onClick={saveDraft}><CheckCircle2 size={16} />Save draft</button>
            <button className="btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <div className="rules-mini">All broadcasts require opt-in consent. Doctor or admin review required before sending. Educational only — no clinical advice, no dosage, no diagnosis.</div>
        </Panel>
      )}
      <Panel title="Broadcast library" icon={Bell}>
        <table><thead><tr><th>Topic</th><th>Audience</th><th>Content preview</th><th>Status</th><th>Opt-ins</th><th>Engagement</th><th>Actions</th></tr></thead>
          <tbody>
            {broadcasts.map(b => (
              <tr key={b.id}>
                <td><strong>{b.topic}</strong><span>{b.id}</span></td>
                <td>{b.audience}</td>
                <td className="script">{b.content}</td>
                <td><Badge tone={toneFor(b.status)}>{b.status}</Badge></td>
                <td>{b.optIns ? b.optIns.toLocaleString("en-IN") : "—"}</td>
                <td>{b.engagement ? `${b.engagement}%` : "—"}</td>
                <td>
                  <div className="action-row" style={{ marginTop: 0, gap: 6 }}>
                    {b.status === "Draft" && <button className="btn mini" onClick={() => updateStatus(b.id, "Pending approval")}>Submit for review</button>}
                    {b.status === "Pending approval" && <button className="btn mini" onClick={() => updateStatus(b.id, "Approved")}>Approve</button>}
                    {b.status === "Approved" && <button className="btn mini" onClick={() => updateStatus(b.id, "Sent", { sent: "2026-05-04", optIns: optedIn, engagement: 61 + Math.floor(Math.random() * 22) })}>Send now</button>}
                    {b.status === "Sent" && <span style={{ fontSize: 12, color: "#6a828a" }}>Sent {b.sent}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rules-mini">Opt-out: parents reply STOP anytime. All sends require logged approval. Broadcasts are non-clinical and non-promotional.</div>
      </Panel>
      <div className="broadcast-cards">
        <Card title="Opted-in parents" value={optedIn.toLocaleString("en-IN")} sub="Active Telegram community" icon={Users} />
        <Card title="Broadcasts sent" value={broadcasts.filter(b => b.status === "Sent").length} sub="This quarter" icon={Bell} />
        <Card title="Avg engagement rate" value={`${avgEngagement}%`} sub="View / tap rate" icon={Activity} />
        <Card title="Pending approval" value={broadcasts.filter(b => ["Draft", "Pending approval"].includes(b.status)).length} sub="Awaiting review" icon={ClipboardCheck} />
      </div>
    </>
  );
}

/* ─── Pharmacy Conversion View ─── */
function PharmacyConversion({ prescriptions, search, onExport }) {
  const filtered = prescriptions.filter(p =>
    [p.patient, p.uhid, p.doctor, p.department, p.status].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const totalMeds = filtered.reduce((a, p) => a + p.medicines.length, 0);
  const capturedMeds = filtered.reduce((a, p) => a + p.purchased.length, 0);
  const totalValue = filtered.reduce((a, p) => a + p.medicines.reduce((s, m) => s + m.price, 0), 0);
  const capturedValue = filtered.reduce((a, p) => a + p.purchased.reduce((s, m) => s + m.price, 0), 0);

  return (
    <>
      <div className="conversion-summary">
        <div className="conv-card captured">
          <strong>{capturedMeds.toLocaleString("en-IN")} / {totalMeds.toLocaleString("en-IN")}</strong>
          <span>Medicines purchased at Surya pharmacy</span>
        </div>
        <div className="conv-card">
          <strong>{money(capturedValue)}</strong>
          <span>Pharmacy revenue captured</span>
        </div>
        <div className="conv-card lost">
          <strong>{money(totalValue - capturedValue)}</strong>
          <span>Estimated pharmacy leakage</span>
        </div>
      </div>
      <Panel title="Medicine-by-medicine conversion analysis" icon={Pill}>
        {filtered.length === 0 ? <EmptyState /> : (
          <table>
            <thead><tr><th>Patient / UHID</th><th>Doctor</th><th>Medicine</th><th>Strength</th><th>Freq × Duration</th><th>Price</th><th>Purchased at Surya</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.slice(0, 35).flatMap(p =>
                p.medicines.map((m, mi) => {
                  const purchased = p.purchased.some(x => x.name === m.name);
                  return (
                    <tr key={`${p.id}-${mi}`}>
                      {mi === 0 && (
                        <td rowSpan={p.medicines.length} style={{ borderRight: "1px solid #edf4f4", background: "#fbffff", verticalAlign: "top" }}>
                          <strong>{p.patient}</strong>
                          <span>{p.uhid}</span>
                          <span>{p.date}</span>
                        </td>
                      )}
                      {mi === 0 && (
                        <td rowSpan={p.medicines.length} style={{ borderRight: "1px solid #edf4f4", background: "#fbffff", verticalAlign: "top" }}>
                          {p.doctor}
                          <span>{p.department}</span>
                        </td>
                      )}
                      <td>{m.name}</td>
                      <td>{m.strength}</td>
                      <td>{m.frequency} × {m.duration}</td>
                      <td>{money(m.price)}</td>
                      <td><Badge tone={purchased ? "good" : "danger"}>{purchased ? "Purchased" : "Not purchased"}</Badge></td>
                      <td><Badge tone={purchased ? "good" : "warn"}>{purchased ? "Captured" : "Leakage"}</Badge></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
        <div className="rules-mini">Showing first 35 prescriptions from active filters. Follow-up tasks are created for uncaptured medicines with clinical importance. Patient is never pressured — care continuity framing only.</div>
      </Panel>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn secondary" onClick={onExport}><Download size={16} />Export conversion report</button>
      </div>
    </>
  );
}

/* ─── Parent Profile Modal ─── */
function ParentProfileModal({ selected, onClose }) {
  const interactions = [
    { date: "2026-05-04", type: "Telegram query", topic: selected.topic, status: selected.status },
    { date: "2026-04-28", type: "OPD visit", topic: "Fever follow-up", status: "Completed" },
    { date: "2026-04-15", type: "Vaccination", topic: "MMR — 2nd dose", status: "Completed" },
    { date: "2026-03-22", type: "Lab test", topic: "CBC + CRP", status: "Report generated" },
    { date: "2026-02-10", type: "OPD visit", topic: "Cough and cold", status: "Completed" },
  ];
  const vaccinations = [
    { vaccine: "Hepatitis A — 2nd dose", due: "2026-06-01", status: "Upcoming" },
    { vaccine: "Typhoid booster", due: "2026-07-15", status: "Upcoming" },
    { vaccine: "Influenza (annual)", due: "2026-09-01", status: "Pending schedule" },
  ];
  const engagementScore = 72 + (selected.id.charCodeAt(4) % 20);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">Parent Profile · {selected.branch} · {selected.pinCode}</div>
            <h2>{selected.parentName}</h2>
          </div>
          <button className="btn ghost" onClick={onClose}>Close ×</button>
        </div>
        <div className="profile-stat-grid">
          <div className="profile-stat"><strong>{selected.childName}</strong><span>Child name</span></div>
          <div className="profile-stat"><strong>{selected.childAge}</strong><span>Child age</span></div>
          <div className="profile-stat"><strong>{engagementScore}/100</strong><span>Community engagement</span></div>
          <div className="profile-stat"><strong>{selected.language}</strong><span>Preferred language</span></div>
        </div>
        <div className="grid two">
          <Panel title="Parent details" icon={Users}>
            <div className="profile-grid">
              <span>Telegram handle</span><strong>{selected.telegramHandle || "Demo handle"}</strong>
              <span>Consent status</span><Badge tone={selected.consent === "Opted in" ? "good" : "warn"}>{selected.consent}</Badge>
              <span>Branch</span><strong>{selected.branch}</strong>
              <span>Pin code</span><strong>{selected.pinCode}</strong>
              <span>Topic focus</span><Badge>{selected.topic}</Badge>
              <span>Current urgency</span><Badge tone={selected.urgency.includes("Emergency") ? "danger" : selected.urgency.includes("Urgent") ? "warn" : "neutral"}>{selected.urgency}</Badge>
            </div>
          </Panel>
          <Panel title="Child profile" icon={HeartPulse}>
            <div className="profile-grid">
              <span>Child name</span><strong>{selected.childName}</strong>
              <span>Age</span><strong>{selected.childAge}</strong>
              <span>Department</span><strong>{selected.department}</strong>
              <span>Assigned reviewer</span><strong>{selected.reviewer}</strong>
              <span>Red flags on record</span><strong style={{ color: selected.redFlags.length ? "#a83125" : undefined }}>{selected.redFlags.length ? selected.redFlags.join("; ") : "None"}</strong>
            </div>
          </Panel>
        </div>
        <Panel title="Interaction history" icon={ClipboardCheck}>
          <table><thead><tr><th>Date</th><th>Type</th><th>Topic</th><th>Status</th></tr></thead>
            <tbody>{interactions.map((r, i) => <tr key={i}><td>{r.date}</td><td>{r.type}</td><td>{r.topic}</td><td><Badge tone={r.status === "Completed" ? "good" : r.status === "Escalated" ? "danger" : "neutral"}>{r.status}</Badge></td></tr>)}</tbody>
          </table>
        </Panel>
        <Panel title="Vaccination schedule" icon={Activity}>
          <table><thead><tr><th>Vaccine</th><th>Due date</th><th>Status</th></tr></thead>
            <tbody>{vaccinations.map((v, i) => <tr key={i}><td>{v.vaccine}</td><td>{v.due}</td><td><Badge tone="warn">{v.status}</Badge></td></tr>)}</tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

/* ─── Campaign / Camp Calendar ─── */
function CampaignCalendar() {
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // May 2026 starts on Friday (index 5)
  const startIndex = 5;
  const totalDays = 31;
  const events = {
    4:  [{ label: "Today", type: "today-marker" }],
    6:  [{ label: "Vaccination camp", type: "camp" }],
    10: [{ label: "WhatsApp reminder", type: "reminder" }],
    13: [{ label: "Pediatric OPD camp", type: "camp" }],
    17: [{ label: "Broadcast: Monsoon", type: "reminder" }],
    20: [{ label: "ENT camp — 401107", type: "camp" }],
    24: [{ label: "WhatsApp blast", type: "reminder" }],
    27: [{ label: "Neonatal camp", type: "camp" }],
    31: [{ label: "Monthly camp review", type: "camp" }],
  };

  const cells = [];
  for (let i = 0; i < startIndex; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <Panel title="Campaign and camp calendar — May 2026" icon={CalendarDays}>
      <div className="campaign-calendar">
        {dayHeaders.map(d => <div key={d} className="cal-header">{d}</div>)}
        {cells.map((day, i) => (
          <div key={i} className={`cal-day ${day === 4 ? "today" : ""} ${day && events[day] && events[day][0].type !== "today-marker" ? "has-event" : ""}`}>
            {day && <strong>{day}</strong>}
            {day && events[day] && events[day].map((ev, ei) => (
              <div key={ei} className={`cal-event ${ev.type}`}>{ev.label}</div>
            ))}
          </div>
        ))}
      </div>
      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "#29a06c" }} />Camp event</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "#c47e14" }} />WhatsApp broadcast</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "#0e8aa0" }} />Today — May 4, 2026</span>
      </div>
    </Panel>
  );
}

export default App;
