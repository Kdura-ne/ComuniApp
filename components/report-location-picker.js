"use client";

import { useEffect, useId, useRef, useState } from "react";

import { COMMUNITY } from "@/lib/constants";
import { getCoordinatePair } from "@/lib/coordinates";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const googleMapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

function toPoint(latitude, longitude) {
  const coordinates = getCoordinatePair(latitude, longitude);
  if (!coordinates) return null;
  return { lat: coordinates.latitude, lng: coordinates.longitude };
}

function normalizePoint(point) {
  const lat = typeof point?.lat === "function" ? point.lat() : Number(point?.lat);
  const lng = typeof point?.lng === "function" ? point.lng() : Number(point?.lng);
  return toPoint(lat, lng);
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
  const autocompleteContainerRef = useRef(null);
  const autocompleteElementRef = useRef(null);
  const operationsRef = useRef({});
  const latestRef = useRef({ address, latitude, longitude, onAddressInput, onLocationSelect, onPendingChange });
  const requestSequenceRef = useRef(0);
  const [mapProvider, setMapProvider] = useState("loading");
  const [autocompleteAvailable, setAutocompleteAvailable] = useState(false);
  const [actionState, setActionState] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("Preparando o mapa…");
  const errorId = useId();
  const statusId = useId();
  const hasConfirmedPoint = Boolean(toPoint(latitude, longitude));

  latestRef.current = { address, latitude, longitude, onAddressInput, onLocationSelect, onPendingChange };

  useEffect(() => {
    const autocomplete = autocompleteElementRef.current;
    if (!autocomplete || autocomplete.value === address) return;
    autocomplete.value = address;
  }, [address]);

  useEffect(() => {
    const autocomplete = autocompleteElementRef.current;
    if (!autocomplete) return;
    if (error) {
      autocomplete.setAttribute("aria-invalid", "true");
      autocomplete.setAttribute("aria-describedby", errorId);
    } else {
      autocomplete.removeAttribute("aria-invalid");
      autocomplete.setAttribute("aria-describedby", statusId);
    }
  }, [error, errorId, statusId]);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    function commitLocation(pointValue, nextAddress) {
      const point = normalizePoint(pointValue);
      if (!point || cancelled) return;
      latestRef.current.onLocationSelect({
        address: String(nextAddress || latestRef.current.address || coordinateAddress(point)).trim().slice(0, 240),
        latitude: point.lat.toFixed(6),
        longitude: point.lng.toFixed(6),
      });
      latestRef.current.onPendingChange?.(false);
    }

    async function mountLeaflet(reason) {
      if (cancelled || !mapContainerRef.current) return;
      mapContainerRef.current.replaceChildren();
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
          marker = L.marker([point.lat, point.lng], { draggable: true, icon: markerIcon }).addTo(map);
          marker.on("dragend", () => {
            requestSequenceRef.current += 1;
            const selected = marker.getLatLng();
            commitLocation(selected, latestRef.current.address || coordinateAddress(selected));
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
        commitLocation(point, latestRef.current.address || coordinateAddress(point));
        setActionState("success");
        setStatusMessage("Ponto confirmado no mapa alternativo. Confira também o endereço digitado.");
      }

      map.on("click", (event) => selectPoint(event.latlng));
      if (initialPoint) showPoint(initialPoint, false);

      operationsRef.current = {
        selectPoint,
        showPoint,
        clearPoint,
        selectCenter: () => selectPoint(map.getCenter()),
        geocodeAddress: null,
      };
      setAutocompleteAvailable(false);
      setMapProvider("fallback");
      setStatusMessage(reason || "Marque o ponto diretamente no mapa e confira o endereço digitado.");

      cleanup = () => {
        operationsRef.current = {};
        map.remove();
      };
    }

    async function mountGoogleMap() {
      const maps = await loadGoogleMaps(googleMapsApiKey);
      const [{ Map }, { AdvancedMarkerElement }, { Geocoder }, { PlaceAutocompleteElement }] = await Promise.all([
        maps.importLibrary("maps"),
        maps.importLibrary("marker"),
        maps.importLibrary("geocoding"),
        maps.importLibrary("places"),
      ]);
      if (cancelled || !mapContainerRef.current || !autocompleteContainerRef.current) return;

      const initialPoint = toPoint(latestRef.current.latitude, latestRef.current.longitude);
      const center = initialPoint || { lat: COMMUNITY.latitude, lng: COMMUNITY.longitude };
      const map = new Map(mapContainerRef.current, {
        center,
        zoom: initialPoint ? 17 : 15,
        mapId: googleMapsMapId,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "cooperative",
        clickableIcons: false,
      });
      const marker = new AdvancedMarkerElement({
        map,
        position: initialPoint || center,
        gmpDraggable: true,
        title: "Local da denúncia. Arraste para ajustar.",
      });
      if (!initialPoint) marker.map = null;
      const geocoder = new Geocoder();

      function showPoint(pointValue, centerMap = true) {
        const point = normalizePoint(pointValue);
        if (!point) return;
        marker.map = map;
        marker.position = point;
        if (centerMap) {
          map.panTo(point);
          if ((map.getZoom() || 0) < 17) map.setZoom(17);
        }
      }

      function clearPoint() {
        marker.map = null;
      }

      async function reverseGeocodeAndSelect(pointValue) {
        const point = normalizePoint(pointValue);
        if (!point) return;
        const requestId = ++requestSequenceRef.current;
        showPoint(point);
        latestRef.current.onPendingChange?.(true);
        setActionState("loading");
        setStatusMessage("Confirmando o endereço deste ponto…");
        try {
          const { results } = await geocoder.geocode({ location: point, region: "br" });
          if (cancelled || requestId !== requestSequenceRef.current) return;
          commitLocation(point, results[0]?.formatted_address || latestRef.current.address || coordinateAddress(point));
          setActionState("success");
          setStatusMessage("Endereço e ponto no mapa confirmados.");
        } catch {
          if (cancelled || requestId !== requestSequenceRef.current) return;
          commitLocation(point, latestRef.current.address || coordinateAddress(point));
          setActionState("warning");
          setStatusMessage("Ponto confirmado. Não foi possível completar o endereço automaticamente; revise o texto antes de enviar.");
        }
      }

      async function geocodeAddress() {
        const query = latestRef.current.address.trim();
        if (query.length < 5) {
          setActionState("error");
          setStatusMessage("Digite um endereço mais completo antes de localizá-lo.");
          return;
        }
        const requestId = ++requestSequenceRef.current;
        latestRef.current.onPendingChange?.(true);
        setActionState("loading");
        setStatusMessage("Localizando o endereço no mapa…");
        try {
          const { results } = await geocoder.geocode({
            address: query,
            componentRestrictions: { country: "BR" },
            bounds: map.getBounds() || undefined,
            region: "br",
          });
          const result = results[0];
          const point = normalizePoint(result?.geometry?.location);
          if (!point) throw new Error("Endereço sem coordenadas");
          if (cancelled || requestId !== requestSequenceRef.current) return;
          showPoint(point);
          commitLocation(point, result.formatted_address || query);
          setActionState("success");
          setStatusMessage("Endereço encontrado e ponto confirmado. Ajuste o marcador se necessário.");
        } catch {
          if (cancelled || requestId !== requestSequenceRef.current) return;
          latestRef.current.onPendingChange?.(false);
          setActionState("error");
          setStatusMessage("Não encontramos esse endereço. Escolha uma sugestão ou marque o ponto diretamente no mapa.");
        }
      }

      map.addListener("click", (event) => {
        if (event.latLng) reverseGeocodeAndSelect(event.latLng);
      });
      marker.addListener("dragend", () => reverseGeocodeAndSelect(marker.position));

      const autocomplete = new PlaceAutocompleteElement({
        value: latestRef.current.address,
        includedRegionCodes: ["br"],
        locationBias: { center: { lat: COMMUNITY.latitude, lng: COMMUNITY.longitude }, radius: 50000 },
        requestedLanguage: "pt-BR",
        requestedRegion: "br",
        placeholder: "Digite a rua, número e bairro",
        description: "Endereço da denúncia. Selecione uma sugestão para confirmar o ponto no mapa.",
        maxlength: 240,
        noInputIcon: true,
      });
      autocomplete.className = "block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-950 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100";
      autocomplete.setAttribute("aria-label", "Endereço ou local da denúncia");
      autocomplete.setAttribute("aria-describedby", statusId);

      const handleManualInput = () => {
        const nextAddress = String(autocomplete.value || "");
        if (nextAddress === latestRef.current.address) return;
        requestSequenceRef.current += 1;
        latestRef.current.onPendingChange?.(false);
        latestRef.current.onAddressInput(nextAddress);
        setActionState("idle");
        setStatusMessage("Selecione uma sugestão ou confirme o endereço no mapa.");
      };
      const handlePlaceSelection = async (event) => {
        const requestId = ++requestSequenceRef.current;
        latestRef.current.onPendingChange?.(true);
        setActionState("loading");
        setStatusMessage("Confirmando o local selecionado…");
        try {
          const place = event.placePrediction.toPlace();
          await place.fetchFields({ fields: ["formattedAddress", "location", "viewport"] });
          const point = normalizePoint(place.location);
          if (!point) throw new Error("Local sem coordenadas");
          if (cancelled || requestId !== requestSequenceRef.current) return;
          if (place.viewport) map.fitBounds(place.viewport);
          else showPoint(point);
          showPoint(point, false);
          commitLocation(point, place.formattedAddress || autocomplete.value);
          setActionState("success");
          setStatusMessage("Endereço e ponto no mapa confirmados.");
        } catch {
          if (cancelled || requestId !== requestSequenceRef.current) return;
          latestRef.current.onPendingChange?.(false);
          setActionState("error");
          setStatusMessage("Não foi possível confirmar essa sugestão. Tente novamente ou marque o ponto no mapa.");
        }
      };
      const handleAutocompleteError = () => {
        requestSequenceRef.current += 1;
        latestRef.current.onPendingChange?.(false);
        setAutocompleteAvailable(false);
        setActionState("warning");
        setStatusMessage("O autocomplete está indisponível. Digite o endereço e use o mapa para confirmar o ponto.");
      };

      autocomplete.addEventListener("input", handleManualInput);
      autocomplete.addEventListener("change", handleManualInput);
      autocomplete.addEventListener("gmp-select", handlePlaceSelection);
      autocomplete.addEventListener("gmp-error", handleAutocompleteError);
      autocompleteContainerRef.current.replaceChildren(autocomplete);
      autocompleteElementRef.current = autocomplete;

      operationsRef.current = {
        selectPoint: reverseGeocodeAndSelect,
        showPoint,
        clearPoint,
        selectCenter: () => reverseGeocodeAndSelect(map.getCenter()),
        geocodeAddress,
      };
      setAutocompleteAvailable(true);
      setMapProvider("google");
      setStatusMessage(initialPoint ? "Ponto carregado. Arraste o marcador para ajustar, se necessário." : "Digite e selecione uma sugestão ou marque o ponto diretamente no mapa.");

      if (initialPoint && !latestRef.current.address.trim()) reverseGeocodeAndSelect(initialPoint);

      cleanup = () => {
        operationsRef.current = {};
        autocomplete.removeEventListener("input", handleManualInput);
        autocomplete.removeEventListener("change", handleManualInput);
        autocomplete.removeEventListener("gmp-select", handlePlaceSelection);
        autocomplete.removeEventListener("gmp-error", handleAutocompleteError);
        autocompleteElementRef.current = null;
        marker.map = null;
        maps.event.clearInstanceListeners(map);
        maps.event.clearInstanceListeners(marker);
        autocompleteContainerRef.current?.replaceChildren();
        mapContainerRef.current?.replaceChildren();
      };
    }

    async function initialize() {
      if (!googleMapsApiKey) {
        await mountLeaflet("O Google Maps não está configurado. Digite o endereço e marque o ponto no mapa alternativo.");
        return;
      }
      try {
        await mountGoogleMap();
      } catch {
        await mountLeaflet("O Google Maps está indisponível. Digite o endereço e marque o ponto no mapa alternativo.");
      }
    }

    initialize();
    return () => {
      cancelled = true;
      requestSequenceRef.current += 1;
      cleanup();
    };
  }, [statusId]);

  useEffect(() => {
    const point = toPoint(latitude, longitude);
    if (point) operationsRef.current.showPoint?.(point, false);
    else operationsRef.current.clearPoint?.();
  }, [latitude, longitude]);

  function handleFallbackAddressChange(event) {
    requestSequenceRef.current += 1;
    latestRef.current.onPendingChange?.(false);
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
    latestRef.current.onPendingChange?.(true);
    setActionState("loading");
    setStatusMessage("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestId !== requestSequenceRef.current) return;
        operationsRef.current.selectPoint?.({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        if (requestId !== requestSequenceRef.current) return;
        latestRef.current.onPendingChange?.(false);
        setActionState("error");
        setStatusMessage("Não foi possível acessar sua localização. Selecione o ponto manualmente no mapa.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const statusColor = error || actionState === "error"
    ? "text-red-700"
    : actionState === "warning"
      ? "text-amber-700"
      : hasConfirmedPoint
        ? "text-brand-700"
        : "text-slate-500";

  return (
    <div className="space-y-3 lg:col-span-2">
      <div>
        <label htmlFor={mapProvider === "google" && autocompleteAvailable ? undefined : "endereco-denuncia"} className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
          Endereço ou local <span className="text-red-600">*</span>
        </label>
        <div
          ref={autocompleteContainerRef}
          className={mapProvider === "google" && autocompleteAvailable ? "block" : "hidden"}
        />
        {mapProvider !== "google" || !autocompleteAvailable ? (
          <input
            id="endereco-denuncia"
            type="text"
            value={address}
            onChange={handleFallbackAddressChange}
            maxLength={240}
            autoComplete="street-address"
            placeholder="Ex.: Rua das Flores, 123, perto da praça"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : statusId}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        ) : null}
        {error ? <p id={errorId} role="alert" className="mt-1.5 text-xs font-bold text-red-700">{error}</p> : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => operationsRef.current.geocodeAddress?.()}
          disabled={mapProvider !== "google" || actionState === "loading" || address.trim().length < 5}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-brand-700 hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🔎 Localizar endereço
        </button>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={mapProvider === "loading" || actionState === "loading"}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-brand-700 hover:border-brand-300 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-50"
        >
          ⌖ Usar localização atual
        </button>
        <button
          type="button"
          onClick={() => operationsRef.current.selectCenter?.()}
          disabled={mapProvider === "loading" || actionState === "loading"}
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
        {mapProvider === "loading" ? (
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
