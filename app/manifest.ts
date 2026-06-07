import type { MetadataRoute } from "next";

// Web app manifest — makes ORCA installable to the home screen. Next serves
// this at /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORCA — Outreach, Resource & Caregiver Assistance",
    short_name: "ORCA",
    description:
      "Outreach, Resource & Caregiver Assistance: a caregiver-first companion that turns public health advisories into clear, personalised actions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#e3f2fd",
    theme_color: "#e3f2fd",
    lang: "en",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
