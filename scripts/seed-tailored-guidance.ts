/**
 * Seed the tailored_guidance table on Supabase with hand-curated, real,
 * verified guidance resources per (hazard, target). Run once after the SQL
 * migration:
 *
 *   npx tsx --env-file=.env.local scripts/seed-tailored-guidance.ts
 *
 * Re-runnable: upsert on (hazard, target).
 *
 * Note: this script creates its OWN Supabase client (rather than importing
 * lib/supabaseServer.ts) because that module imports "server-only", which
 * tsx cannot resolve outside a Next.js build context.
 */

import { createClient } from '@supabase/supabase-js';

interface Row {
  hazard: 'covid' | 'dengue';
  target: string;
  source: string;
  title: string;
  url: string;
  blurb?: string;
}

const SEED: Row[] = [
  // ── Diabetes ────────────────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Diabetes',
    source: 'CDC',
    title: 'People with Certain Medical Conditions and COVID-19 Risk Factors',
    url: 'https://www.cdc.gov/covid/risk-factors/index.html',
    blurb:
      'CDC guidance identifying diabetes (type 1 or type 2) as a risk factor for severe COVID-19 with links to diabetes-specific resources.',
  },
  {
    hazard: 'dengue',
    target: 'Diabetes',
    source: 'CDC',
    title: 'Clinical Care of Dengue',
    url: 'https://www.cdc.gov/dengue/hcp/clinical-care/index.html',
    blurb:
      'CDC clinical care guidance flagging diabetes as a comorbidity warranting case-by-case inpatient management for dengue patients.',
  },

  // ── Heart ───────────────────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Heart',
    source: 'CDC',
    title: 'COVID-19 and Cardiovascular Disease Toolkit',
    url: 'https://millionhearts.hhs.gov/partners-progress/partners/COVID19-CVD-toolkit.html',
    blurb:
      "CDC Million Hearts toolkit: people with serious heart conditions are at higher risk for severe COVID-19; keep taking heart meds and don't delay emergency care.",
  },
  {
    hazard: 'dengue',
    target: 'Heart',
    source: 'Singapore Heart Foundation',
    title: 'Deadly Complication Behind Dengue Fever: Myocarditis',
    url: 'https://www.myheart.org.sg/heart-news/deadly-complication-behind-dengue-fever-myocarditis/',
    blurb:
      'Singapore Heart Foundation explains dengue-induced myocarditis, warning signs (chest pain, breathlessness), and the critical days 4-7 window for cardiac monitoring.',
  },

  // ── Stroke ──────────────────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Stroke',
    source: 'ASA',
    title: 'Stroke and the Impact of COVID19',
    url: 'https://www.stroke.org/en/life-after-stroke/covid19-stroke-podcast-series-for-patients-and-caregivers/stroke-and-the-impact-of-covid19',
    blurb:
      "American Stroke Association resource addressing stroke survivors' COVID-19 health risks and how to stay healthy during the pandemic.",
  },

  // ── Cancer ──────────────────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Cancer',
    source: 'ACS',
    title: 'COVID-19 and Cancer',
    url: 'https://www.cancer.org/cancer/managing-cancer/side-effects/infections/covid-19.html',
    blurb:
      'American Cancer Society guidance on COVID-19 risks, vaccines, prevention, and treatment considerations for people with cancer.',
  },

  // ── Kidney ──────────────────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Kidney',
    source: 'NKF',
    title: 'COVID-19 and Kidney Disease',
    url: 'https://www.kidney.org/kidney-topics/covid-19-and-kidney-disease',
    blurb:
      'National Kidney Foundation guidance on COVID-19 risks, prevention, and treatment for CKD, dialysis, and kidney transplant patients.',
  },

  // ── Respiratory ─────────────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Respiratory',
    source: 'ALA',
    title: 'COVID-19 | American Lung Association',
    url: 'https://www.lung.org/lung-health-diseases/lung-disease-lookup/covid-19',
    blurb:
      'American Lung Association hub on COVID-19 risk, prevention, vaccination, and recovery for people with chronic lung disease such as asthma, COPD, and interstitial lung disease.',
  },
  {
    hazard: 'dengue',
    target: 'Respiratory',
    source: 'CDC',
    title: 'Clinical Care of Dengue | Dengue | CDC',
    url: 'https://www.cdc.gov/dengue/hcp/clinical-care/index.html',
    blurb:
      'CDC clinical guidance identifying asthma as a co-existing condition warranting inpatient consideration and respiratory distress as a marker of severe dengue.',
  },

  // ── Dementia ────────────────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Dementia',
    source: 'ADI',
    title:
      'Advice and support during COVID-19: General advice and resources from Alzheimer associations',
    url: 'https://www.alzint.org/resource/advice-and-support-during-covid-19-general-advice-and-resources-from-alzheimer-associations/',
    blurb:
      "Alzheimer's Disease International hub of COVID-19 guidance for people living with dementia and their caregivers, compiled from Alzheimer associations worldwide and WHO.",
  },

  // ── Immunocompromised ───────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Immunocompromised',
    source: 'CDC',
    title: 'Vaccines for Moderately to Severely Immunocompromised People',
    url: 'https://www.cdc.gov/covid/vaccines/immunocompromised-people.html',
    blurb:
      'CDC guidance on COVID-19 vaccination for moderately or severely immunocompromised people, including eligibility for additional doses.',
  },

  // ── Mobility ────────────────────────────────────────────────────
  {
    hazard: 'covid',
    target: 'Mobility',
    source: 'BGS',
    title:
      'Deconditioning information for providers of services for older people and the public',
    url: 'https://www.bgs.org.uk/deconditioning-information-for-providers-of-services-for-older-people-and-the-public',
    blurb:
      'BGS/National Falls Prevention Co-ordination Group reconditioning resources to restore mobility and reduce falls risk in older adults after COVID-19 activity restrictions.',
  },
];

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main() {
  const sb = client();
  const { error } = await sb
    .from('tailored_guidance')
    .upsert(SEED, { onConflict: 'hazard,target' });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  const byHazard = SEED.reduce(
    (a, r) => ({ ...a, [r.hazard]: (a[r.hazard] ?? 0) + 1 }),
    {} as Record<string, number>,
  );
  const targets = new Set(SEED.map((r) => r.target));
  console.log(
    `Seeded ${SEED.length} tailored guidance resources (covid: ${byHazard.covid ?? 0}, dengue: ${byHazard.dengue ?? 0}, targets: ${targets.size}).`,
  );
}

void main();
