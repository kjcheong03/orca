"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { dengueGeo } from "@/lib/dengueGeo";

// Mapbox token from env (see .env.local). Same light basemap style as the
// data.gov.sg dengue-clusters viewer.
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface Home {
  lat: number;
  lng: number;
}

// Fit the view to the clusters + home on mount.
function FitBounds({ home }: { home: Home }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.geoJSON(dengueGeo).getBounds().extend([home.lat, home.lng]);
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
  }, [map, home]);
  return null;
}

export default function ClusterMapLive({ home }: { home: Home }) {
  return (
    <div className="h-[380px] overflow-hidden rounded-2xl">
      <MapContainer
        center={[home.lat, home.lng]}
        zoom={13}
        scrollWheelZoom={false}
        zoomControl
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
          tileSize={512}
          zoomOffset={-1}
          attribution="&copy; Mapbox &copy; OpenStreetMap"
        />

        {/* actual NEA cluster polygons */}
        <GeoJSON
          data={dengueGeo}
          style={() => ({
            color: "#e5544e",
            weight: 2,
            fillColor: "#e5544e",
            fillOpacity: 0.25,
          })}
          onEachFeature={(feature, layer) => {
            const p = (feature.properties ?? {}) as { locality?: string; cases?: number };
            layer.bindPopup(
              `<strong>${p.locality ?? "Cluster"}</strong><br/>${p.cases ?? 0} cases`,
            );
          }}
        />

        {/* distance rings around home */}
        <Circle
          center={[home.lat, home.lng]}
          radius={1000}
          pathOptions={{ color: "#2563eb", weight: 1, opacity: 0.35, fillOpacity: 0.04 }}
        />
        <Circle
          center={[home.lat, home.lng]}
          radius={3000}
          pathOptions={{ color: "#2563eb", weight: 1, opacity: 0.25, fillOpacity: 0.02, dashArray: "4 4" }}
        />

        {/* home */}
        <CircleMarker
          center={[home.lat, home.lng]}
          radius={7}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            Home
          </Tooltip>
        </CircleMarker>

        <FitBounds home={home} />
      </MapContainer>
    </div>
  );
}
