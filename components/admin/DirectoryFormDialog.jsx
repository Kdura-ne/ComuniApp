"use client";

import { useEffect, useState } from "react";

import AdminModal from "./AdminModal";

const COLORS = [
  { value: "#dc2626", label: "Vermelho", swatch: "bg-[#dc2626]" },
  { value: "#1d4ed8", label: "Azul", swatch: "bg-[#1d4ed8]" },
  { value: "#f97316", label: "Laranja", swatch: "bg-[#f97316]" },
  { value: "#7c3aed", label: "Roxo", swatch: "bg-[#7c3aed]" },
  { value: "#3a9e72", label: "Verde", swatch: "bg-[#3a9e72]" },
  { value: "#eab308", label: "Amarelo", swatch: "bg-[#eab308]" },
];

const ICONS = ["🏥", "👮", "🏫", "🤝", "🚑", "📮", "🏛️", "🚒", "🌳", "⛪", "📚", "⚽", "🎸", "🤲"];
const DIRECTORY_TYPES = ["Saúde", "Segurança", "Educação", "Social", "Serviços", "Cultura", "Esportes"];

function initialForm(entry, defaultKind) {
  return {
    kind: entry?.kind || defaultKind || "public_service",
    name: entry?.name || "",
    type: entry?.type || "",
    description: entry?.description || "",
    address: entry?.address || "",
    phone: entry?.phone || "",
    hours: entry?.hours || "",
    icon: entry?.icon || (defaultKind === "ngo" ? "🤝" : "🏥"),
    color: entry?.color || "#3a9e72",
    tags: Array.isArray(entry?.tags) ? entry.tags.join(", ") : "",
    sortOrder: entry?.sortOrder ?? 0,
  };
}

const fieldClass =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-[#3a9e72] focus:ring-4 focus:ring-[#3a9e72]/10";
const labelClass =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500";

export default function DirectoryFormDialog({
  entry,
  defaultKind,
  busy,
  error,
  onCancel,
  onSubmit,
}) {
  const [form, setForm] = useState(() => initialForm(entry, defaultKind));

  useEffect(() => {
    setForm(initialForm(entry, defaultKind));
  }, [entry, defaultKind]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const tags = [...new Set(form.tags.split(",").map((tag) => tag.trim()).filter(Boolean))];

    onSubmit({
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
      tags,
      ...(entry ? { expectedVersion: entry.version } : {}),
    });
  }

  return (
    <AdminModal
      title={entry ? "Editar cadastro" : "Novo cadastro"}
      description="Os dados publicados aparecem na área de Serviços e ONGs."
      onClose={busy ? () => {} : onCancel}
    >
      <form className="space-y-4 p-4" onSubmit={handleSubmit}>
        <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
          <div>
            <span className={labelClass}>Tipo de cadastro</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["public_service", "🏛️ Serviço público"],
                ["ngo", "🌱 ONG ou projeto"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={form.kind === value}
                  onClick={() => setField("kind", value)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-xs font-extrabold transition ${
                    form.kind === value
                      ? "border-[#3a9e72] bg-[#f0faf5] text-[#1f7655]"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[92px_1fr]">
            <div>
              <label htmlFor="directory-icon" className={labelClass}>
                Ícone
              </label>
              <select
                id="directory-icon"
                value={form.icon}
                onChange={(event) => setField("icon", event.target.value)}
                className={`${fieldClass} text-xl`}
              >
                {ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="directory-name" className={labelClass}>
                Nome *
              </label>
              <input
                id="directory-name"
                required
                minLength={2}
                maxLength={160}
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                className={fieldClass}
                placeholder={form.kind === "ngo" ? "Nome da organização" : "Nome do serviço"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="directory-type" className={labelClass}>
              Categoria *
            </label>
            <select
              id="directory-type"
              required
              value={form.type}
              onChange={(event) => setField("type", event.target.value)}
              className={fieldClass}
            >
              <option value="" disabled>Selecione uma categoria</option>
              {DIRECTORY_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="directory-description" className={labelClass}>
              Descrição
            </label>
            <textarea
              id="directory-description"
              rows={3}
              maxLength={600}
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              className={`${fieldClass} resize-y`}
              placeholder="Explique brevemente o atendimento oferecido."
            />
          </div>

          <div>
            <label htmlFor="directory-address" className={labelClass}>
              Endereço {form.kind === "public_service" ? "*" : ""}
            </label>
            <input
              id="directory-address"
              required={form.kind === "public_service"}
              maxLength={240}
              value={form.address}
              onChange={(event) => setField("address", event.target.value)}
              className={fieldClass}
              placeholder="Rua, número e referência"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="directory-phone" className={labelClass}>
                Telefone
              </label>
              <input
                id="directory-phone"
                type="tel"
                maxLength={30}
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value)}
                className={fieldClass}
                placeholder="(11) 0000-0000"
              />
            </div>
            <div>
              <label htmlFor="directory-hours" className={labelClass}>
                Horário
              </label>
              <input
                id="directory-hours"
                maxLength={120}
                value={form.hours}
                onChange={(event) => setField("hours", event.target.value)}
                className={fieldClass}
                placeholder="Seg–Sex: 8h–17h"
              />
            </div>
          </div>

          <div>
            <label htmlFor="directory-tags" className={labelClass}>
              Tags, separadas por vírgula
            </label>
            <input
              id="directory-tags"
              value={form.tags}
              onChange={(event) => setField("tags", event.target.value)}
              className={fieldClass}
              placeholder="Gratuito, Crianças, Famílias"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
            <div>
              <span className={labelClass}>Cor</span>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={form.color === option.value}
                    onClick={() => setField("color", option.value)}
                    className={`h-9 w-9 rounded-full ${option.swatch} transition ${
                      form.color === option.value
                        ? "ring-4 ring-slate-900/25 ring-offset-2"
                        : "ring-1 ring-black/10 hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="directory-order" className={labelClass}>
                Ordem
              </label>
              <input
                id="directory-order"
                type="number"
                min="0"
                max="10000"
                value={form.sortOrder}
                onChange={(event) => setField("sortOrder", event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        </fieldset>

        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#3a9e72] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#2f855f] disabled:cursor-wait disabled:bg-slate-300"
          >
            {busy ? "Salvando…" : entry ? "Salvar alterações" : "Publicar cadastro"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
