"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { REPORT_CATEGORIES as CATEGORY_DEFINITIONS } from "@/lib/constants";
import { getCoordinatePair } from "@/lib/coordinates";
import ReportLocationPicker from "@/components/report-location-picker";

const REPORT_CATEGORIES = CATEGORY_DEFINITIONS.map((category) => ({
  id: category.slug,
  label: category.label,
  icon: category.icon,
  scope: category.scope,
}));

const securityIds = new Set(["assalto", "tentativa-roubo", "area-perigosa", "animal"]);
const generalIds = new Set(["buraco", "iluminacao", "poste", "lixo", "enchente", "transito", "parque", "calcada", "assalto", "animal"]);
const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function fieldError(errors, field) {
  const value = errors?.[field];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : "";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a foto selecionada."));
    reader.readAsDataURL(file);
  });
}

export default function ReportForm({
  mode = "general",
  initialAddress = "",
  initialLatitude = "",
  initialLongitude = "",
  compact = false,
}) {
  const categories = useMemo(
    () => REPORT_CATEGORIES.filter((category) => (mode === "security" ? securityIds : generalIds).has(category.id)),
    [mode],
  );
  const [step, setStep] = useState("category");
  const [categoryId, setCategoryId] = useState("");
  const [address, setAddress] = useState(initialAddress);
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [locationPending, setLocationPending] = useState(false);
  const [pending, setPending] = useState(false);
  const [createdReport, setCreatedReport] = useState(null);
  const formHeadingId = useId();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return undefined;
    }
    const preview = URL.createObjectURL(photo);
    setPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [photo]);

  function chooseCategory(id) {
    setCategoryId(id);
    setFieldErrors((current) => ({ ...current, categoryId: "" }));
  }

  function advanceToDetails() {
    if (!categoryId) {
      setFieldErrors({ categoryId: "Escolha uma categoria para continuar." });
      return;
    }
    setFieldErrors({});
    setStep("details");
    requestAnimationFrame(() => document.getElementById("detalhes-denuncia")?.focus());
  }

  function returnToCategory() {
    setLocationPending(false);
    setStep("category");
    setSubmitError("");
  }

  function selectPhoto(event) {
    const selected = event.target.files?.[0] || null;
    if (!selected) return;
    if (!allowedPhotoTypes.has(selected.type)) {
      setFieldErrors((current) => ({ ...current, photo: "Use uma imagem JPG, PNG ou WebP." }));
      event.target.value = "";
      return;
    }
    if (selected.size > 1024 * 1024) {
      setFieldErrors((current) => ({ ...current, photo: "A foto deve ter no máximo 1 MB." }));
      event.target.value = "";
      return;
    }
    setPhoto(selected);
    setFieldErrors((current) => ({ ...current, photo: "" }));
  }

  function removePhoto() {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateAddressManually(nextAddress) {
    setAddress(nextAddress);
    setLatitude("");
    setLongitude("");
    setFieldErrors((current) => ({ ...current, address: "", location: "" }));
  }

  function confirmLocation({ address: nextAddress, latitude: nextLatitude, longitude: nextLongitude }) {
    setAddress(nextAddress);
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setFieldErrors((current) => ({ ...current, address: "", location: "" }));
  }

  function validateDetails() {
    const errors = {};
    if (address.trim().length < 5) errors.address = "Informe a rua, número ou um ponto de referência.";
    if (locationPending) {
      errors.location = "Aguarde enquanto confirmamos o endereço e o ponto no mapa.";
    } else if (!getCoordinatePair(latitude, longitude)) {
      errors.location = "Confirme o local selecionando uma sugestão, clicando no mapa ou usando sua localização atual.";
    }
    if (description.trim().length < 10) errors.description = "Descreva o ocorrido com pelo menos 10 caracteres.";
    if (reporterName.trim().length < 2) errors.reporterName = "Informe seu nome.";
    if (!/^\S+@\S+\.\S+$/.test(reporterEmail.trim())) errors.reporterEmail = "Informe um e-mail válido.";
    setFieldErrors(errors);
    return !Object.keys(errors).length;
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!validateDetails() || pending || locationPending) return;
    setPending(true);
    setSubmitError("");

    try {
      const selectedCategory = categories.find((category) => category.id === categoryId);
      const payload = {
        scope: mode === "security" || selectedCategory?.scope === "security" ? "security" : "civic",
        category: categoryId,
        address: address.trim(),
        description: description.trim(),
        isAnonymous: true,
        reporterName: reporterName.trim(),
        reporterEmail: reporterEmail.trim().toLowerCase(),
        region: region.trim() || "Centro",
        latitude: latitude === "" ? null : Number(latitude),
        longitude: longitude === "" ? null : Number(longitude),
      };
      if (photo) {
        payload.image = {
          mimeType: photo.type,
          base64: await fileToDataUrl(photo),
        };
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const serverErrors = result.fieldErrors || result.details?.fieldErrors;
        if (serverErrors) {
          setFieldErrors({
            ...serverErrors,
            categoryId: serverErrors.category || serverErrors.categoryId,
            location: serverErrors.latitude || serverErrors.longitude || serverErrors.location,
            photo: serverErrors.image || serverErrors.photo,
          });
        }
        throw new Error(result.error || "Não foi possível enviar a denúncia.");
      }
      setCreatedReport(result.report);
      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setSubmitError(requestError.message || "Não foi possível enviar a denúncia.");
    } finally {
      setPending(false);
    }
  }

  function resetForm() {
    setStep("category");
    setCategoryId("");
    setAddress("");
    setRegion("");
    setDescription("");
    setReporterName("");
    setReporterEmail("");
    setLatitude("");
    setLongitude("");
    setPhoto(null);
    setFieldErrors({});
    setSubmitError("");
    setLocationPending(false);
    setCreatedReport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (step === "success") {
    return (
      <section className="rounded-3xl border border-brand-200 bg-white p-6 text-center shadow-soft sm:p-10" aria-labelledby={formHeadingId}>
        <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-full bg-brand-100 text-3xl text-brand-800">✓</span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-brand-700">Recebemos seu relato</p>
        <h2 id={formHeadingId} className="mt-2 font-display text-3xl font-black text-slate-950">Denúncia registrada!</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-relaxed text-slate-600">
          Obrigado por contribuir com o bairro. Guarde o protocolo para acompanhar todas as atualizações.
        </p>
        <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-brand-200 bg-brand-50 px-5 py-5 text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">Protocolo</p>
          <p className="mt-1 break-all font-display text-2xl font-black text-brand-950">{createdReport?.protocol}</p>
          <p className="mt-2 text-xs font-bold text-brand-800/70">Status: {createdReport?.statusLabel || "Aberto"}</p>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {createdReport?.protocol ? (
            <Link href={`/ocorrencias/${encodeURIComponent(createdReport.protocol)}`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-800">
              Acompanhar ocorrência
            </Link>
          ) : null}
          <button type="button" onClick={resetForm} className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
            Registrar outra
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft ${compact ? "" : "mx-auto max-w-4xl"}`} aria-labelledby={formHeadingId}>
      <header className="border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">
              Passo {step === "category" ? "1" : "2"} de 2
            </p>
            <h2 id={formHeadingId} className="mt-1 font-display text-xl font-black text-slate-950">
              {step === "category" ? "O que aconteceu?" : "Conte os detalhes"}
            </h2>
          </div>
          <ol className="flex gap-1.5" aria-label="Progresso da denúncia">
            <li aria-current={step === "category" ? "step" : undefined} className={`h-2 w-10 rounded-full ${step === "category" ? "bg-brand-600" : "bg-brand-200"}`}><span className="sr-only">Categoria</span></li>
            <li aria-current={step === "details" ? "step" : undefined} className={`h-2 w-10 rounded-full ${step === "details" ? "bg-brand-600" : "bg-slate-200"}`}><span className="sr-only">Detalhes</span></li>
          </ol>
        </div>
      </header>

      {step === "category" ? (
        <div className="p-5 sm:p-7">
          <fieldset>
            <legend className="text-sm font-extrabold text-slate-600">Selecione a categoria que melhor descreve o problema:</legend>
            <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {categories.map((category) => {
                const selected = categoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => chooseCategory(category.id)}
                    aria-pressed={selected}
                    className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition ${selected ? "border-brand-500 bg-brand-50 text-brand-950 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/50"}`}
                  >
                    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm ring-1 ring-slate-100">{category.icon}</span>
                    <span className="text-sm font-black leading-tight">{category.label}</span>
                    {selected ? <span className="ml-auto text-brand-700" aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {fieldError(fieldErrors, "categoryId") ? <p role="alert" className="mt-3 text-sm font-bold text-red-700">{fieldError(fieldErrors, "categoryId")}</p> : null}
          <button type="button" onClick={advanceToDetails} disabled={!categoryId} className="mt-6 min-h-12 w-full rounded-2xl bg-brand-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:ml-auto sm:block sm:w-auto sm:min-w-48">
            Continuar <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <form onSubmit={submitReport} className="p-5 sm:p-7" noValidate>
          <button type="button" onClick={returnToCategory} className="mb-5 min-h-10 rounded-xl px-2 py-2 text-xs font-black text-brand-700 hover:bg-brand-50">
            ← Alterar categoria
          </button>
          <h3 id="detalhes-denuncia" tabIndex="-1" className="sr-only">Detalhes da denúncia</h3>

          <div className="grid gap-5 lg:grid-cols-2">
            <ReportLocationPicker
              address={address}
              latitude={latitude}
              longitude={longitude}
              error={fieldError(fieldErrors, "address") || fieldError(fieldErrors, "location")}
              onAddressInput={updateAddressManually}
              onLocationSelect={confirmLocation}
              onPendingChange={setLocationPending}
            />

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Região do bairro <span className="font-semibold normal-case text-slate-400">(opcional)</span></span>
              <input type="text" value={region} onChange={(event) => setRegion(event.target.value)} maxLength={80} placeholder="Ex.: Centro, Norte, Mutirão" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100" />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide text-slate-600">
                <span>Descrição <span className="text-red-600">*</span></span>
                <span className="font-semibold normal-case text-slate-400">{description.length}/1000</span>
              </span>
              <textarea value={description} onChange={(event) => { setDescription(event.target.value); setFieldErrors((current) => ({ ...current, description: "" })); }} rows={5} maxLength={1000} placeholder="Descreva o problema, há quanto tempo acontece e algum ponto de referência…" aria-invalid={Boolean(fieldError(fieldErrors, "description"))} aria-describedby={fieldError(fieldErrors, "description") ? "erro-descricao" : undefined} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold leading-relaxed text-slate-950 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100" />
              {fieldError(fieldErrors, "description") ? <span id="erro-descricao" className="mt-1.5 block text-xs font-bold text-red-700">{fieldError(fieldErrors, "description")}</span> : null}
            </label>

            <div className="lg:col-span-2">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Foto <span className="font-semibold normal-case text-slate-400">(opcional, até 1 MB)</span></span>
              {photo ? (
                <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-3">
                  {photoPreview ? <img src={photoPreview} alt="Prévia da foto selecionada" className="size-16 rounded-xl object-cover" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-brand-950">{photo.name}</p>
                    <p className="text-xs font-semibold text-brand-800/60">{Math.max(1, Math.round(photo.size / 1024))} KB</p>
                  </div>
                  <button type="button" onClick={removePhoto} className="min-h-10 rounded-xl px-3 text-xs font-black text-red-700 hover:bg-red-50">Remover</button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-brand-300 hover:bg-brand-50">
                  <span aria-hidden="true" className="text-2xl">📷</span>
                  <span className="mt-1 text-sm font-black text-slate-700">Adicionar foto</span>
                  <span className="mt-0.5 text-xs font-semibold text-slate-400">JPG, PNG ou WebP</span>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="sr-only" />
                </label>
              )}
              {fieldError(fieldErrors, "photo") ? <p role="alert" className="mt-1.5 text-xs font-bold text-red-700">{fieldError(fieldErrors, "photo")}</p> : null}
            </div>

            <div className="grid gap-4 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 lg:col-span-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100">🔒</span>
                  <div>
                    <p className="text-sm font-black text-brand-950">Identificação obrigatória e protegida</p>
                    <p className="mt-0.5 text-xs font-semibold leading-relaxed text-brand-900/65">A denúncia será sempre anônima para a comunidade. Nome e e-mail ficam visíveis somente para a equipe administrativa responsável.</p>
                  </div>
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Nome <span className="text-red-600">*</span></span>
                <input type="text" value={reporterName} onChange={(event) => { setReporterName(event.target.value); setFieldErrors((current) => ({ ...current, reporterName: "" })); }} maxLength={120} autoComplete="name" aria-invalid={Boolean(fieldError(fieldErrors, "reporterName"))} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100" />
                {fieldError(fieldErrors, "reporterName") ? <span className="mt-1.5 block text-xs font-bold text-red-700">{fieldError(fieldErrors, "reporterName")}</span> : null}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">E-mail <span className="text-red-600">*</span></span>
                <input type="email" value={reporterEmail} onChange={(event) => { setReporterEmail(event.target.value); setFieldErrors((current) => ({ ...current, reporterEmail: "" })); }} maxLength={254} autoComplete="email" aria-invalid={Boolean(fieldError(fieldErrors, "reporterEmail"))} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100" />
                {fieldError(fieldErrors, "reporterEmail") ? <span className="mt-1.5 block text-xs font-bold text-red-700">{fieldError(fieldErrors, "reporterEmail")}</span> : null}
              </label>
            </div>
          </div>

          {submitError ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{submitError}</div> : null}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={returnToCategory} className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50">Voltar</button>
            <button type="submit" disabled={pending || locationPending} className="min-h-12 rounded-xl bg-brand-700 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-brand-800 disabled:cursor-wait disabled:bg-slate-400">
              {locationPending ? "Confirmando local…" : pending ? "Enviando…" : "Enviar denúncia"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
