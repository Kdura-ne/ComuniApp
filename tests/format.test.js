import assert from "node:assert/strict";
import test from "node:test";

import { digitsOnly, isValidProtocol, normalizeProtocol, relativeDate } from "../lib/format.js";

test("normaliza e valida protocolos públicos", () => {
  assert.equal(normalizeProtocol(" #d2026-0012 "), "D2026-0012");
  assert.equal(isValidProtocol("D2026-0012"), true);
  assert.equal(isValidProtocol("2026-12"), false);
});

test("remove formatação de números telefônicos", () => {
  assert.equal(digitsOnly("(11) 4002-8922"), "1140028922");
});

test("formata datas recentes sem depender do relógio global", () => {
  const now = new Date("2026-08-24T15:00:00.000Z");
  assert.equal(relativeDate("2026-08-24T14:42:00.000Z", now), "Há 18 min");
  assert.equal(relativeDate("2026-08-23T15:00:00.000Z", now), "Ontem");
});
