"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getCoordinatePair } from "@/lib/coordinates";

const markerColors = {
  open: "#dc2626",
  in_review: "#d97706",
  resolved: "#267a57",
  rejected: "#64748b",
};

export default function CommunityMap({ reports = [], community, compact = false, allowLocation = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const locationLayerRef = useRef(null);
  const statusId = useId();
  const [locationState, setLocationState] = useState("idle");

  useEffect(() => {
    let cancelled = false;
    let resizeObserver;

    async function mountMap() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const communityCoordinates = getCoordinatePair(community?.latitude, community?.longitude);
      const fallbackLat = communityCoordinates?.latitude ?? -23.67;
      const fallbackLng = communityCoordinates?.longitude ?? -46.75;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([fallbackLat, fallbackLng], Number(community?.mapZoom) || 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const bounds = [];
      for (const report of reports) {
        const coordinates = getCoordinatePair(report.latitude, report.longitude);
        if (!coordinates) continue;
        const point = [coordinates.latitude, coordinates.longitude];
        bounds.push(point);
        const marker = L.circleMarker(point, {
          radius: 9,
          color: "#ffffff",
          weight: 3,
          fillColor: markerColors[report.status] || markerColors.rejected,
          fillOpacity: 1,
        }).addTo(map);

        const popup = document.createElement("div");
        popup.className = "min-w-44";
        const category = document.createElement("p");
        category.className = "text-[10px] font-black uppercase tracking-wide text-brand-700";
        category.textContent = `${report.categoryIcon || "📍"} ${report.categoryLabel || report.categoryShortLabel || report.category || "Ocorrência"}`;
        const title = document.createElement("p");
        title.className = "mt-1 font-display text-sm font-black text-slate-950";
        title.textContent = report.title || report.address || "Ocorrência comunitária";
        const link = document.createElement("a");
        link.className = "mt-2 inline-block text-xs font-black text-brand-700 underline underline-offset-2";
        link.href = report.protocol ? `/ocorrencias/${encodeURIComponent(report.protocol)}` : "/ocorrencias";
        link.textContent = "Ver detalhes";
        popup.append(category, title, link);
        marker.bindPopup(popup);
      }

      if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 });
      else if (bounds.length === 1) map.setView(bounds[0], 16);

      mapRef.current = map;
      resizeObserver = new ResizeObserver(() => map.invalidateSize());
      resizeObserver.observe(containerRef.current);
    }

    mountMap();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      locationLayerRef.current = null;
    };
  }, [community, reports]);

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationState("unsupported");
      return;
    }

    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const map = mapRef.current;
        const L = leafletRef.current;
        if (!map || !L) return setLocationState("error");
        locationLayerRef.current?.remove();
        locationLayerRef.current = L.circleMarker([coords.latitude, coords.longitude], {
          radius: 8,
          color: "#1d4ed8",
          weight: 3,
          fillColor: "#ffffff",
          fillOpacity: 1,
        }).addTo(map).bindPopup("Você está aqui").openPopup();
        map.setView([coords.latitude, coords.longitude], 16);
        setLocationState("success");
      },
      () => setLocationState("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const locationMessage = {
    idle: "",
    loading: "Buscando sua localização…",
    success: "Sua localização foi marcada no mapa.",
    error: "Não foi possível acessar sua localização.",
    unsupported: "Este dispositivo não oferece geolocalização.",
  }[locationState];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-card">
      <div
        ref={containerRef}
        className={compact ? "h-64 w-full sm:h-72" : "h-[22rem] w-full sm:h-[30rem]"}
        role="region"
        aria-label={`Mapa de ocorrências em ${community?.name || "sua comunidade"}`}
      />
      {allowLocation ? (
        <div className="absolute bottom-7 left-3 z-[400] flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-1">
          <button
            type="button"
            onClick={locateUser}
            disabled={locationState === "loading"}
            aria-describedby={locationMessage ? statusId : undefined}
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-lg hover:bg-brand-50 hover:text-brand-800 disabled:cursor-wait disabled:opacity-70"
          >
            {locationState === "loading" ? "Localizando…" : "⌖ Usar minha localização"}
          </button>
          {locationMessage ? (
            <p id={statusId} role="status" className="rounded-lg bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-white">
              {locationMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
