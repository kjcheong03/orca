import type {
  Advisory,
  Broadcast,
  CareGuide,
  Contact,
  EmergencyReason,
  Patient,
} from "./types";

// ---------------------------------------------------------------------------
// Care recipient
// ---------------------------------------------------------------------------
export const patient: Patient = {
  name: "Madam Tan Bee Hoon",
  initials: "TB",
  sex: "Female",
  age: 78,
  address: "Blk 123 Ang Mo Kio Ave 6, #08-45, Singapore 560123",
  conditions: ["Hypertension", "Type 2 Diabetes"],
  emergencyMedicine: [
    {
      name: "GTN spray",
      dose: "1 spray under the tongue",
      instructions:
        "When chest pain: 1 spray under the tongue. May repeat after 5 min (max 3). If no better, call 995.",
    },
    {
      name: "Aspirin 300 mg",
      dose: "1 tablet (300 mg), chewed",
      instructions:
        "For sudden crushing chest pain: chew 1 tablet once, then call 995 immediately.",
    },
  ],
  measurements: [
    { label: "Blood pressure", value: "148 / 86 mmHg", takenAt: "Today · 8:10 AM", status: "high" },
    { label: "Blood glucose", value: "9.2 mmol/L", takenAt: "Today · 7:45 AM", status: "high" },
    { label: "Heart rate", value: "78 bpm", takenAt: "Today · 8:10 AM", status: "normal" },
  ],
};

// ---------------------------------------------------------------------------
// Environment risks (Info → Environment risks)
// ---------------------------------------------------------------------------
export const environmentRisks: Advisory[] = [
  {
    id: "heat",
    icon: "🌡️",
    title: "Heat advisory",
    source: "NEA",
    severity: "PRECAUTIONARY",
    status: "HIGH HEAT STRESS",
    statusTone: "warn",
    metric: "33°C · Feels 39°C",
    whatToDo: [
      "Drink water regularly, even if not thirsty.",
      "Stay in a cool, shaded or air-conditioned space during midday.",
      "Watch for dizziness, confusion or cramps — move to a cool place and sip water.",
    ],
    updated: "Updated · 9:00 AM",
    why: {
      text: "Madam Tan Bee Hoon — Older adults feel heat less and dehydrate quickly. Some blood-pressure medicines raise the risk of heat exhaustion.",
      conditions: ["Hypertension", "Type 2 Diabetes"],
      sourceLabel: "Official advisory · NEA",
    },
  },
];

// ---------------------------------------------------------------------------
// Active health signals (Info → Active health signals)
// ---------------------------------------------------------------------------
export const healthSignals: Advisory[] = [
  {
    id: "dengue",
    icon: "🦟",
    title: "Dengue cluster nearby",
    source: "NEA",
    severity: "URGENT",
    statusTone: "danger",
    summary:
      "Active cluster on Tampines St 21 — 42 cases. Remove stagnant water, use repellent on the elderly, cover arms and legs.",
    whatToDo: [
      "Remove stagnant water indoors and around the home (vases, trays, drains).",
      "Apply repellent on the elderly and keep arms and legs covered, especially at dawn and dusk.",
      "Watch for fever with body aches, rash or bleeding gums — see a doctor early; dengue can worsen fast in older adults.",
    ],
    updated: "NEA · today",
    why: {
      text: "Madam Tan Bee Hoon — Older adults often get more severe dengue with a higher risk of bleeding and dangerous drops in blood pressure, and warning signs can be subtle.",
      conditions: ["Hypertension", "Type 2 Diabetes"],
      sourceLabel: "Official advisory · NEA",
    },
  },
  {
    id: "respiratory",
    icon: "🤧",
    title: "Respiratory illness rising",
    source: "MOH",
    severity: "PRECAUTIONARY",
    statusTone: "warn",
    summary:
      "Clinic visits for cough and flu are climbing islandwide. Keep up hand hygiene and consider a mask in crowded places.",
    whatToDo: [
      "Wash hands often and avoid touching the face.",
      "Wear a mask in crowded or enclosed places.",
      "Keep up flu and COVID-19 vaccinations if due; see a doctor early if fever or breathlessness appears.",
    ],
    updated: "MOH · today",
    why: {
      text: "Madam Tan Bee Hoon — Respiratory infections can hit older adults harder and worsen existing conditions. Early care lowers the chance of complications.",
      conditions: ["Hypertension", "Type 2 Diabetes"],
      sourceLabel: "Official advisory · MOH",
    },
  },
];

// ---------------------------------------------------------------------------
// Broadcasts (top banner → Broadcast sheet)
// ---------------------------------------------------------------------------
export const broadcasts: Broadcast[] = [
  {
    id: "covid",
    title: "COVID-19 activity is rising",
    body: "MOH reports rising COVID-19 and influenza activity, with a mild increase in admissions among older adults. Keep COVID-19 and flu boosters up to date, test early at the first sign of symptoms, and consider a mask in crowded or enclosed indoor places. Watch the elderly for fever, cough or breathlessness, and seek care promptly for chest pain, confusion or trouble breathing — older adults can deteriorate quickly.",
    source: "MOH",
    time: "8:30 AM",
  },
  {
    id: "dengue-red",
    title: "National dengue alert — Red",
    body: "Weekly dengue cases are above the epidemic threshold with several large clusters active islandwide. Do the 5-step Mozzie Wipeout at home: change vase water, turn pails, loosen hardened soil, clear roof gutters and add insecticide, and clear blockages in scupper drains. Apply repellent on the elderly, use bed nets, and keep them in long sleeves at dusk. Seek care early for fever with body aches, rash or vomiting — dengue can deteriorate quickly in older adults.",
    source: "MOH",
    time: "yesterday",
  },
];

/** The compact banner pinned at the top of the Info screens. */
export const bannerBroadcast = {
  title: "COVID-19 activity is rising",
  preview: "MOH reports rising COVID-19 and influenza activity",
};

// ---------------------------------------------------------------------------
// Emergency contacts (Contacts tab)
// ---------------------------------------------------------------------------
export const contacts: Contact[] = [
  {
    id: "son",
    initials: "WM",
    name: "Mr Tan Wei Ming",
    relation: "Son",
    phone: "+65 9123 4567",
    role: "family",
  },
  {
    id: "clinic",
    initials: "DL",
    name: "Dr Lim",
    relation: "Clinic",
    phone: "+65 6789 0123",
    role: "clinic",
  },
];

export const ambulance = { label: "995 · Ambulance", phone: "995" };

// ---------------------------------------------------------------------------
// Emergency triage flow
// ---------------------------------------------------------------------------
export const emergencyReasons: EmergencyReason[] = [
  { id: "accident", label: "An accident", icon: "car", statement: "There has been an accident with injuries." },
  { id: "chest-pain", label: "Chest pain", icon: "heart", statement: "She is having chest pain." },
  { id: "breathless", label: "Breathlessness", icon: "lungs", statement: "She is having trouble breathing." },
  { id: "unconscious", label: "Unconsciousness", icon: "user-x", statement: "She is unconscious and not responding." },
  { id: "fall", label: "A fall", icon: "person-fall", statement: "She has had a fall and may be injured." },
  { id: "fainted", label: "Fainted", icon: "user-sleep", statement: "She fainted and lost consciousness briefly." },
];

// ---------------------------------------------------------------------------
// Care guides (Support → Care guides)
// ---------------------------------------------------------------------------
export const careGuides: CareGuide[] = [
  { id: "bp", title: "Check blood pressure", group: "procedure" },
  { id: "glucose", title: "Check blood glucose", group: "procedure" },
];

// ---------------------------------------------------------------------------
// Request help (Support → Request help)
// ---------------------------------------------------------------------------
export const helpOptions = [
  "Supplies (masks, test kits, repellent)",
  "Medication collection",
  "Transport to clinic or care point",
  "Food or essentials (quarantine)",
  "Community check-in",
  "Help understanding an advisory",
];

export const relatedAdvisories = [
  "Not linked to an advisory",
  "Haze advisory in effect",
  "Dengue cluster nearby",
  "Respiratory illness rising",
];

export const contactMethods = ["Phone call", "SMS", "WhatsApp"];

export const routedPartners = [
  "South East CDC — Community Support",
  "SG Cares Volunteer Network",
];
