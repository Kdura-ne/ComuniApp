"use client";

import { useEffect, useId, useRef, useState } from "react";

import { COMMUNITY } from "@/lib/constants";
import { getCoordinatePair } from "@/lib/coordinates";

function toPoint(latitude, longitude) {
  const coordinates = getCoordinatePair(latitude, longitude);
  if (!coordinates) return null;
  return { lat: coordinates.latitude, lng: coordinates.longitude };
}

function normalizePoint(point) {
  return toPoint(Number(point?.lat), Number(point?.lng));
}

function coordinateAddress(point) {
  return `Local selecionado (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)})`;
}

export default function ReportLocationPicker({
  address,
  latitude,
  longitude,
  error = "",
  onAddressInput,
  onLocationSelect,
  onPendingChange,
}) {
  const mapContainerRef = useRef(null);
  const operationsRef = useRef({});
  const latestRef = useRef({ address, latitude, longitude, onLocationSelect, onPendingChange });
  const requestSequenceRef = useRef(0);
  const [mapState, setMapState] = useState("loading");
  const [actionState, setActionState] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("Preparando o mapa…");
  const errorId = useId();
  const statusId = useId();
  const hasConfirmedPoint = Boolean(toPoint(latitude, longitude));

  latestRef.current = { address, latitude, longitude, onLocationSelect, onPendingChange };

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    function commitLocation(pointValue) {
      const point = normalizePoint(pointValue);
      if (!point || cancelled) return;
      const currentAddress = latestRef.current.address.trim();
      latestRef.current.onLocationSelect({
        address: (currentAddress || coordinateAddress(point)).slice(0, 240),
        latitude: point.lat.toFixed(6),
        longitude: point.lng.toFixed(6),
      });
      latestRef.current.onPendingChange?.(false);
    }

    async function mountMap() {
      try {
        const L = await import("leaflet");
        if (cancelled || !mapContainerRef.current) return;

        const initialPoint = toPoint(latestRef.current.latitude, latestRef.current.longitude);
        const center = initialPoint || { lat: COMMUNITY.latitude, lng: COMMUNITY.longitude };
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: false,
        }).setView([center.lat, center.lng], initialPoint ? 17 : 15);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const markerIcon = L.divIcon({
          className: "bg-transparent",
          html: '<span aria-hidden="true" class="block -translate-x-1/2 -translate-y-full text-3xl drop-shadow-md">📍</span>',
          iconSize: [1, 1],
          iconAnchor: [0, 0],
        });
        let marker = null;

        function showPoint(pointValue, centerMap = true) {
          const point = normalizePoint(pointValue);
          if (!point) return;
          if (!marker) {
            marker = L.marker([point.lat, point.lng], {
              draggable: true,
              icon: markerIcon,
              title: "Local da denúncia. Arraste para ajustar.",
            }).addTo(map);
            marker.on("dragend", () => {
              requestSequenceRef.current += 1;
              const selected = marker.getLatLng();
              commitLocation(selected);
              setActionState("success");
              setStatusMessage("Ponto confirmado. O marcador pode ser arrastado para ajustar o local.");
            });
          } else {
            marker.setLatLng([point.lat, point.lng]);
          }
          if (centerMap) map.setView([point.lat, point.lng], Math.max(map.getZoom(), 17));
        }

        function clearPoint() {
          marker?.remove();
          marker = null;
        }

        function selectPoint(pointValue) {
          const point = normalizePoint(pointValue);
          if (!point) return;
          requestSequenceRef.current += 1;
          showPoint(point);
          commitLocation(point);
          setActionState("success");
          setStatusMessage("Ponto confirmado. Confira também o endereço digitado.");
        }

        map.on("click", (event) => selectPoint(event.latlng));
        if (initialPoint) showPoint(initialPoint, false);

        operationsRef.current = {
          selectPoint,
          showPoint,
          clearPoint,
          selectCenter: () => selectPoint(map.getCenter()),
        };
        setMapState("ready");
        setStatusMessage(
          initialPoint
            ? "Ponto carregado. Arraste o marcador para ajustar, se necessário."
            : "Digite o endereço e marque o ponto correspondente no mapa.",
        );

        const resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(mapContainerRef.current);

        cleanup = () => {
          operationsRef.current = {};
          resizeObserver.disconnect();
          map.remove();
        };
      } catch {
        if (cancelled) return;
        latestRef.current.onPendingChange?.(false);
        setMapState("error");
        setActionState("error");
        setStatusMessage("Não foi possível carregar o mapa. Recarregue a página e tente novamente.");
      }
    }

    mountMap();
    return () => {
      cancelled = true;
      requestSequenceRef.current += 1;
      cleanup();
    };
  }, []);

  useEffect(() => {
    const point = toPoint(latitude, longitude);
    if (point) operationsRef.current.showPoint?.(point, false);
    else operationsRef.current.clearPoint?.();
  }, [latitude, longitude]);

  function handleAddressChange(event) {
    requestSequenceRef.current += 1;
    onPendingChange?.(false);
    onAddressInput(event.target.value);
    setActionState("idle");
    setStatusMessage("Confirme o endereço escolhendo o ponto correspondente no mapa.");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setActionState("error");
      setStatusMessage("Este dispositivo não oferece geolocalização.");
      return;
    }
    const requestId = ++requestSequenceRef.current;
    onPendingChange?.(true);
    setActionState("loading");
    setStatusMessage("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestId !== requestSequenceRef.current) return;
        operationsRef.current.selectPoint?.({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        if (requestId !== requestSequenceRef.current) return;
        onPendingChange?.(false);
        setActionState("error");
        setStatusMessage("Não foi possível acessar sua localização. Selecione o ponto manualmente no mapa.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const statusColor = error || actionState === "error"
    ? "text-red-700"
    : hasConfirmedPoint
      ? "text-brand-700"
      : "text-slate-500";

  return (
    <div className="space-y-3 lg:col-span-2">
      <div>
        <label htmlFor="endereco-denuncia" className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
          Endereço ou local <span className="text-red-600">*</span>
        </label>
        <input
          id="endereco-denuncia"
          type="text"
          value={address}
          onChange={handleAddressChange}
          maxLength={240}
          autoComplete="street-address"
          placeholder="Ex.: Rua das Flores, 123, perto da praça"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : statusId}
          className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
        {error ? <p id={errorId} role="alert" className="mt-1.5 text-xs font-bold text-red-700">{error}</p> : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={mapState !== "ready" || actionState === "loading"}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-brand-700 hover:border-brand-300 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-50"
        >
          ⌖ Usar localização atual
        </button>
        <button
          type="button"
          onClick={() => operationsRef.current.selectCenter?.()}
          disabled={mapState !== "ready" || actionState === "loading"}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-brand-700 hover:border-brand-300 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-50"
        >
          ＋ Marcar centro do mapa
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <div
          ref={mapContainerRef}
          className="h-72 w-full sm:h-80"
          role="region"
          aria-label="Mapa interativo para selecionar o local exato da denúncia"
        />
        {mapState === "loading" ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-100/95 px-5 text-center text-sm font-bold text-slate-500">
            Preparando mapa interativo…
          </div>
        ) : null}
        <div className="pointer-events-none absolute left-3 top-3 z-[400] max-w-[calc(100%-1.5rem)] rounded-xl bg-slate-950/85 px-3 py-2 text-[11px] font-bold leading-relaxed text-white shadow-lg">
          Clique no mapa ou arraste o marcador para ajustar o ponto.
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p id={statusId} role="status" aria-live="polite" className={`text-xs font-bold leading-relaxed ${statusColor}`}>
          {statusMessage}
        </p>
        {hasConfirmedPoint ? (
          <p className="shrink-0 font-mono text-[10px] font-bold text-slate-500">
            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          </p>
        ) : (
          <p className="shrink-0 text-[10px] font-black uppercase tracking-wide text-amber-700">Ponto não confirmado</p>
        )}
      </div>
    </div>
  );
}
