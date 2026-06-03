// ---------------------------------------------------------------------------
// Latest updates (news) and Guidance resources, per hazard.
//
// These are REAL, working links to official / authoritative pages (verified
// live). Cards render as publisher link-previews (favicon + source + headline)
// rather than fabricated article photos, because SG news/gov sites block image
// hotlinking and most expose no usable cover image.
// ---------------------------------------------------------------------------

import type { Hazard } from "./scenario";

export interface MediaItem {
  id: string;
  source: string; // publisher, e.g. "NEA", "MOH", "CDC"
  title: string; // real page / article headline
  url: string; // verified-live link
  format: "Update" | "Article";
  time?: string; // shown on "Latest updates" cards
}

export const news: Record<Hazard, MediaItem[]> = {
  covid: [
    {
      id: "c-moh-update",
      source: "MOH",
      title: "Update on the COVID-19 situation",
      time: "13 May 2025",
      format: "Update",
      url: "https://www.moh.gov.sg/newsroom/update-on-covid-19-situation-/",
    },
    {
      id: "c-cda-bulletin",
      source: "CDA",
      title: "Weekly Infectious Diseases Bulletin",
      time: "Updated weekly",
      format: "Update",
      url: "https://www.cda.gov.sg/resources/weekly-infectious-diseases-bulletin-2025/",
    },
    {
      id: "c-moh-hub",
      source: "MOH",
      title: "COVID-19: current situation and guidance",
      time: "Live",
      format: "Update",
      url: "https://www.moh.gov.sg/covid-19",
    },
  ],
  dengue: [
    {
      id: "d-nea-surge",
      source: "NEA",
      title: "Vigilance needed to prevent a dengue surge in 2025",
      time: "25 May 2025",
      format: "Update",
      url: "https://www.nea.gov.sg/media/news/news/index/dengue-outbreaks-averted-in-2023-and-2024---vigilance-needed-to-prevent-dengue-surge-in-2025",
    },
    {
      id: "d-nea-cases",
      source: "NEA",
      title: "Latest dengue cases and active clusters",
      time: "Updated weekly",
      format: "Update",
      url: "https://www.nea.gov.sg/dengue-zika/dengue/dengue-cases",
    },
  ],
};

export const guidance: Record<Hazard, MediaItem[]> = {
  covid: [
    {
      id: "cg-healthhub-flu",
      source: "HealthHub",
      title: "Influenza vaccine: what you need to know",
      format: "Article",
      url: "https://www.healthhub.sg/medication-devices-and-treatment/medications/influenza-vaccine",
    },
    {
      id: "cg-cdc-65",
      source: "CDC",
      title: "Flu and people 65 years and older",
      format: "Article",
      url: "https://www.cdc.gov/flu/highrisk/65over.htm",
    },
    {
      id: "cg-who-covid",
      source: "WHO",
      title: "COVID-19: advice for the public",
      format: "Article",
      url: "https://www.who.int/health-topics/coronavirus",
    },
  ],
  dengue: [
    {
      id: "dg-nea-prevent",
      source: "NEA",
      title: "Prevent dengue: do the 5-step Mozzie Wipeout",
      format: "Article",
      url: "https://www.nea.gov.sg/dengue-zika",
    },
    {
      id: "dg-cdc-signs",
      source: "CDC",
      title: "Dengue symptoms and warning signs",
      format: "Article",
      url: "https://www.cdc.gov/dengue/signs-symptoms/index.html",
    },
    {
      id: "dg-who-fact",
      source: "WHO",
      title: "Dengue and severe dengue — fact sheet",
      format: "Article",
      url: "https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue",
    },
    {
      id: "dg-cdc-prevent",
      source: "CDC",
      title: "Preventing dengue: protect against mosquito bites",
      format: "Article",
      url: "https://www.cdc.gov/dengue/prevention/index.html",
    },
  ],
};
