"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ciudadesCoordenadas: Record<string, [number, number]> = {
  "Bogotá": [4.7110, -74.0721],
  "Barranquilla": [10.9639, -74.7964],
  "Cartagena": [10.3910, -75.4794],
  "Santa Marta": [11.2404, -74.2110],
  "Bucaramanga": [7.1193, -73.1227],
  "Floridablanca": [7.0620, -73.0865],
};

const origenIcon = new L.DivIcon({
  className: "custom-marker",
  html: '<div style="background:#1e40af;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const destinoIcon = new L.DivIcon({
  className: "custom-marker",
  html: '<div style="background:#10b981;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

interface MapViewProps {
  center?: [number, number];
  markers?: Array<{
    position: [number, number];
    label: string;
    type?: "origen" | "destino";
  }>;
  route?: Array<[number, number]>;
  className?: string;
}

function MapUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 6);
    }
  }, [center, map]);
  return null;
}

export function MapView({
  center = [7.1193, -73.1227],
  markers = [],
  route,
  className,
}: MapViewProps) {
  return (
    <div className={className || "h-[400px] w-full rounded-lg border overflow-hidden"}>
      <MapContainer
        center={center}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        {markers.map((marker, i) => (
          <Marker
            key={i}
            position={marker.position}
            icon={marker.type === "origen" ? origenIcon : destinoIcon}
          >
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
        {route && route.length > 1 && (
          <Polyline
            positions={route}
            pathOptions={{ color: "#1e40af", weight: 3, dashArray: "10,5" }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export { ciudadesCoordenadas };
