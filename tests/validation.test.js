import assert from "node:assert/strict";
import test from "node:test";

import { directoryEntrySchema, reportInputSchema } from "../lib/validation.js";

test("aceita uma denúncia cívica válida", () => {
  const result = reportInputSchema.safeParse({
    scope: "civic",
    category: "buraco",
    description: "Há um buraco profundo ocupando metade da via.",
    address: "Rua das Flores, 123",
    latitude: -23.55052,
    longitude: -46.633308,
    isAnonymous: false,
    reporterName: "Moradora de Teste",
    reporterEmail: "MORADORA@EXEMPLO.COM",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.isAnonymous, true);
  assert.equal(result.data.reporterEmail, "moradora@exemplo.com");
});

test("exige um ponto confirmado para a denúncia", () => {
  const result = reportInputSchema.safeParse({
    scope: "civic",
    category: "buraco",
    description: "Há um buraco profundo ocupando metade da via.",
    address: "Rua das Flores, 123",
    reporterName: "Moradora de Teste",
    reporterEmail: "moradora@exemplo.com",
  });
  assert.equal(result.success, false);
  assert.match(result.error.flatten().fieldErrors.latitude?.[0] || "", /Confirme o local/);
});

test("rejeita coordenadas com tipos não escalares", () => {
  const result = reportInputSchema.safeParse({
    scope: "civic",
    category: "buraco",
    description: "Há um buraco profundo ocupando metade da via.",
    address: "Rua das Flores, 123",
    latitude: false,
    longitude: [-46.633308],
    reporterName: "Moradora de Teste",
    reporterEmail: "moradora@exemplo.com",
  });
  assert.equal(result.success, false);
});

test("exige identificação privada do morador", () => {
  const result = reportInputSchema.safeParse({
    scope: "civic",
    category: "buraco",
    description: "Há um buraco profundo ocupando metade da via.",
    address: "Rua das Flores, 123",
    latitude: -23.55052,
    longitude: -46.633308,
  });
  assert.equal(result.success, false);
  assert.ok(result.error.flatten().fieldErrors.reporterName?.length);
  assert.ok(result.error.flatten().fieldErrors.reporterEmail?.length);
});

test("rejeita categoria incompatível com o módulo", () => {
  const result = reportInputSchema.safeParse({
    scope: "security",
    category: "buraco",
    description: "Descrição suficientemente detalhada do problema.",
    address: "Rua das Flores, 123",
    latitude: -23.55052,
    longitude: -46.633308,
    reporterName: "Morador de Teste",
    reporterEmail: "morador@exemplo.com",
  });
  assert.equal(result.success, false);
});

test("exige o endereço de serviços públicos", () => {
  const result = directoryEntrySchema.safeParse({
    kind: "public_service",
    category: "Saúde",
    name: "UBS do bairro",
    address: "",
    icon: "🏥",
    color: "#dc2626",
  });
  assert.equal(result.success, false);
});
