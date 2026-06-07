/**
 * Pre-seed the condition_classifications table on Supabase with hand-coded
 * verdicts for ~100+ common patient-condition strings. Run once after the
 * SQL migration:
 *
 *   npx tsx --env-file=.env.local scripts/seed-classifications.ts
 *
 * Re-runnable: upsert on normalized_condition.
 *
 * Note: this script creates its OWN Supabase client (rather than importing
 * lib/supabaseServer.ts) because that module imports "server-only", which
 * tsx cannot resolve outside a Next.js build context.
 */

import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Target =
  | 'Diabetes' | 'Heart' | 'Stroke' | 'Cancer' | 'Kidney'
  | 'Respiratory' | 'Dementia' | 'Immunocompromised' | 'Mobility';

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

const SEED: Record<string, Target[]> = {
  // ── Diabetes ────────────────────────────────────────────────────
  'diabetes': ['Diabetes'],
  'type 1 diabetes': ['Diabetes'],
  't1dm': ['Diabetes'],
  'type i diabetes': ['Diabetes'],
  'diabetic type 1': ['Diabetes'],
  'type 2 diabetes': ['Diabetes'],
  't2dm': ['Diabetes'],
  'type ii diabetes': ['Diabetes'],
  'diabetic type 2': ['Diabetes'],
  'adult-onset diabetes': ['Diabetes'],
  'pre-diabetes': ['Diabetes'],
  'prediabetes': ['Diabetes'],
  'borderline diabetes': ['Diabetes'],
  'gestational diabetes': ['Diabetes'],
  'insulin-dependent diabetes': ['Diabetes'],
  'diabetic neuropathy': ['Diabetes'],
  'diabetic retinopathy': ['Diabetes'],
  'diabetic nephropathy': ['Diabetes', 'Kidney'],
  'diabetic foot': ['Diabetes'],

  // ── Heart ───────────────────────────────────────────────────────
  'hypertension': ['Heart'],
  'high blood pressure': ['Heart'],
  'htn': ['Heart'],
  'high bp': ['Heart'],
  'coronary artery disease': ['Heart'],
  'cad': ['Heart'],
  'ihd': ['Heart'],
  'ischemic heart disease': ['Heart'],
  'ischaemic heart disease': ['Heart'],
  'angina': ['Heart'],
  'unstable angina': ['Heart'],
  'stable angina': ['Heart'],
  'heart failure': ['Heart'],
  'chf': ['Heart'],
  'congestive heart failure': ['Heart'],
  'systolic heart failure': ['Heart'],
  'diastolic heart failure': ['Heart'],
  'atrial fibrillation': ['Heart'],
  'afib': ['Heart'],
  'a-fib': ['Heart'],
  'arrhythmia': ['Heart'],
  'myocardial infarction': ['Heart'],
  'mi': ['Heart'],
  'heart attack': ['Heart'],
  'post-mi': ['Heart'],
  'previous heart attack': ['Heart'],
  'valvular heart disease': ['Heart'],
  'mitral valve disease': ['Heart'],
  'aortic stenosis': ['Heart'],
  'aortic regurgitation': ['Heart'],
  'pacemaker': ['Heart'],
  'implanted pacemaker': ['Heart'],
  'icd': ['Heart'],
  'cardiomyopathy': ['Heart'],
  'dilated cardiomyopathy': ['Heart'],
  'cardiac arrest': ['Heart'],
  'post-cardiac arrest': ['Heart'],
  'high cholesterol': ['Heart'],
  'hypercholesterolemia': ['Heart'],
  'dyslipidemia': ['Heart'],
  'hyperlipidemia': ['Heart'],
  'peripheral artery disease': ['Heart'],
  'pad': ['Heart'],

  // ── Stroke ──────────────────────────────────────────────────────
  'stroke': ['Stroke'],
  'cva': ['Stroke'],
  'cerebrovascular accident': ['Stroke'],
  'tia': ['Stroke'],
  'transient ischemic attack': ['Stroke'],
  'mini-stroke': ['Stroke'],
  'post-stroke': ['Stroke'],
  'previous stroke': ['Stroke'],
  'history of stroke': ['Stroke'],
  'hemiparesis': ['Stroke', 'Mobility'],
  'hemiplegia': ['Stroke', 'Mobility'],
  'aphasia': ['Stroke'],
  'ischemic stroke': ['Stroke'],
  'hemorrhagic stroke': ['Stroke'],

  // ── Cancer ──────────────────────────────────────────────────────
  'cancer': ['Cancer'],
  'lung cancer': ['Cancer'],
  'breast cancer': ['Cancer'],
  'colorectal cancer': ['Cancer'],
  'colon cancer': ['Cancer'],
  'rectal cancer': ['Cancer'],
  'prostate cancer': ['Cancer'],
  'pancreatic cancer': ['Cancer'],
  'liver cancer': ['Cancer'],
  'stomach cancer': ['Cancer'],
  'gastric cancer': ['Cancer'],
  'ovarian cancer': ['Cancer'],
  'cervical cancer': ['Cancer'],
  'thyroid cancer': ['Cancer'],
  'bladder cancer': ['Cancer'],
  'kidney cancer': ['Cancer'],
  'leukemia': ['Cancer', 'Immunocompromised'],
  'leukaemia': ['Cancer', 'Immunocompromised'],
  'aml': ['Cancer', 'Immunocompromised'],
  'all': ['Cancer', 'Immunocompromised'],
  'cml': ['Cancer', 'Immunocompromised'],
  'cll': ['Cancer', 'Immunocompromised'],
  'lymphoma': ['Cancer', 'Immunocompromised'],
  'hodgkin lymphoma': ['Cancer', 'Immunocompromised'],
  'non-hodgkin lymphoma': ['Cancer', 'Immunocompromised'],
  'nhl': ['Cancer', 'Immunocompromised'],
  'melanoma': ['Cancer'],
  'carcinoma': ['Cancer'],
  'tumor': ['Cancer'],
  'tumour': ['Cancer'],
  'malignant tumor': ['Cancer'],
  'malignant tumour': ['Cancer'],
  'metastatic cancer': ['Cancer'],
  'stage iv cancer': ['Cancer'],
  'in remission': ['Cancer'],
  'undergoing chemotherapy': ['Cancer', 'Immunocompromised'],
  'chemotherapy': ['Cancer', 'Immunocompromised'],
  'chemo': ['Cancer', 'Immunocompromised'],
  'undergoing radiotherapy': ['Cancer'],
  'radiotherapy': ['Cancer'],
  'radiation therapy': ['Cancer'],
  'multiple myeloma': ['Cancer', 'Immunocompromised'],

  // ── Kidney ──────────────────────────────────────────────────────
  'kidney disease': ['Kidney'],
  'chronic kidney disease': ['Kidney'],
  'ckd': ['Kidney'],
  'end-stage renal disease': ['Kidney'],
  'esrd': ['Kidney'],
  'end stage kidney disease': ['Kidney'],
  'renal failure': ['Kidney'],
  'kidney failure': ['Kidney'],
  'acute kidney injury': ['Kidney'],
  'aki': ['Kidney'],
  'dialysis': ['Kidney'],
  'hemodialysis': ['Kidney'],
  'peritoneal dialysis': ['Kidney'],
  'glomerulonephritis': ['Kidney'],
  'kidney transplant': ['Kidney', 'Immunocompromised'],
  'polycystic kidney disease': ['Kidney'],
  'pkd': ['Kidney'],
  'nephropathy': ['Kidney'],

  // ── Respiratory ─────────────────────────────────────────────────
  'copd': ['Respiratory'],
  'chronic obstructive pulmonary disease': ['Respiratory'],
  'asthma': ['Respiratory'],
  'bronchial asthma': ['Respiratory'],
  'chronic bronchitis': ['Respiratory'],
  'emphysema': ['Respiratory'],
  'pulmonary fibrosis': ['Respiratory'],
  'ipf': ['Respiratory'],
  'idiopathic pulmonary fibrosis': ['Respiratory'],
  'interstitial lung disease': ['Respiratory'],
  'ild': ['Respiratory'],
  'obstructive sleep apnea': ['Respiratory'],
  'osa': ['Respiratory'],
  'sleep apnea': ['Respiratory'],
  'sleep apnoea': ['Respiratory'],
  'bronchiectasis': ['Respiratory'],
  'pulmonary hypertension': ['Respiratory', 'Heart'],
  'tuberculosis': ['Respiratory'],
  'tb': ['Respiratory'],
  'on home oxygen': ['Respiratory'],
  'home oxygen therapy': ['Respiratory'],

  // ── Dementia ────────────────────────────────────────────────────
  'dementia': ['Dementia'],
  'alzheimer disease': ['Dementia'],
  "alzheimer's": ['Dementia'],
  "alzheimer's disease": ['Dementia'],
  'ad': ['Dementia'],
  'vascular dementia': ['Dementia', 'Stroke'],
  'lewy body dementia': ['Dementia'],
  'lewy body disease': ['Dementia'],
  'lbd': ['Dementia'],
  'frontotemporal dementia': ['Dementia'],
  'ftd': ['Dementia'],
  'mild cognitive impairment': ['Dementia'],
  'mci': ['Dementia'],
  'memory loss': ['Dementia'],
  'memory problems': ['Dementia'],
  'cognitive decline': ['Dementia'],

  // ── Immunocompromised ───────────────────────────────────────────
  'immunocompromised': ['Immunocompromised'],
  'immunosuppressed': ['Immunocompromised'],
  'immune deficiency': ['Immunocompromised'],
  'immunodeficiency': ['Immunocompromised'],
  'hiv': ['Immunocompromised'],
  'hiv positive': ['Immunocompromised'],
  'aids': ['Immunocompromised'],
  'post-transplant': ['Immunocompromised'],
  'organ transplant recipient': ['Immunocompromised'],
  'liver transplant': ['Immunocompromised'],
  'heart transplant': ['Immunocompromised'],
  'lung transplant': ['Immunocompromised'],
  'bone marrow transplant': ['Immunocompromised'],
  'on immunosuppressants': ['Immunocompromised'],
  'taking immunosuppressants': ['Immunocompromised'],
  'tacrolimus': ['Immunocompromised'],
  'cyclosporine': ['Immunocompromised'],
  'mycophenolate': ['Immunocompromised'],
  'on long-term steroids': ['Immunocompromised'],
  'long-term prednisone': ['Immunocompromised'],
  'chronic steroid use': ['Immunocompromised'],
  'neutropenia': ['Immunocompromised'],
  'neutropenic': ['Immunocompromised'],
  'systemic lupus': ['Immunocompromised'],
  'sle': ['Immunocompromised'],
  'lupus': ['Immunocompromised'],
  'rheumatoid arthritis on biologics': ['Immunocompromised', 'Mobility'],
  'splenectomy': ['Immunocompromised'],
  'no spleen': ['Immunocompromised'],
  'asplenia': ['Immunocompromised'],

  // ── Mobility ────────────────────────────────────────────────────
  'limited mobility': ['Mobility'],
  'mobility impairment': ['Mobility'],
  'reduced mobility': ['Mobility'],
  'wheelchair user': ['Mobility'],
  'wheelchair-bound': ['Mobility'],
  'uses a wheelchair': ['Mobility'],
  'uses a walker': ['Mobility'],
  'uses a cane': ['Mobility'],
  'walking aid': ['Mobility'],
  'frail': ['Mobility'],
  'frailty': ['Mobility'],
  'frail elderly': ['Mobility'],
  "parkinson's": ['Mobility'],
  "parkinson's disease": ['Mobility'],
  'parkinson disease': ['Mobility'],
  'pd': ['Mobility'],
  'history of falls': ['Mobility'],
  'recurrent falls': ['Mobility'],
  'fall risk': ['Mobility'],
  'recent fall': ['Mobility'],
  'bedbound': ['Mobility'],
  'bed-bound': ['Mobility'],
  'bedridden': ['Mobility'],
  'osteoarthritis': ['Mobility'],
  'oa': ['Mobility'],
  'osteoporosis': ['Mobility'],
  'previous hip fracture': ['Mobility'],
  'post hip replacement': ['Mobility'],
  'hip replacement': ['Mobility'],
  'amputation': ['Mobility'],
  'lower limb amputation': ['Mobility'],
  'multiple sclerosis': ['Mobility'],
  'ms': ['Mobility'],
  'spinal cord injury': ['Mobility'],
  'arthritis': ['Mobility'],
};

async function main() {
  const sb = supabaseAdmin();
  const rows = Object.entries(SEED).map(([k, targets]) => ({
    normalized_condition: normalize(k),
    targets,
    model: 'hand-coded',
    reasoning: 'pre-seed',
  }));
  // Dedup on normalized_condition (some entries may collide after normalisation).
  const map = new Map<string, typeof rows[number]>();
  for (const r of rows) map.set(r.normalized_condition, r);
  const unique = Array.from(map.values());
  const { error } = await sb.from('condition_classifications').upsert(unique, {
    onConflict: 'normalized_condition',
  });
  if (error) { console.error(error); process.exit(1); }
  console.log(`Seeded ${unique.length} condition classifications.`);
}

void main();
