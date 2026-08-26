import assert from "node:assert/strict";
import test from "node:test";

import { getCoordinatePair, parseCoordinate } from "../lib/coordinates.js";

test("rejeita coordenadas ausentes antes da conversão numérica", () => {
  assert.equal(parseCoordinate(null, -90, 90), null);
  assert.equal(parseCoordinate(undefined, -90, 90), null);
  assert.equal(parseCoordinate("", -90, 90), null);
  assert.equal(parseCoordinate("   ", -90, 90), null);
  assert.equal(parseCoordinate(false, -90, 90), null);
  assert.equal(parseCoordinate([], -90, 90), null);
  assert.equal(parseCoordinate([12], -90, 90), null);
  assert.equal(getCoordinatePair(null, null), null);
});

test("preserva um par de coordenadas válido, inclusive no meridiano zero", () => {
  assert.deepEqual(getCoordinatePair("-23.550520", "-46.633308"), {
    latitude: -23.55052,
    longitude: -46.633308,
  });
  assert.deepEqual(getCoordinatePair(0, 0), { latitude: 0, longitude: 0 });
});

test("rejeita pares incompletos ou fora dos limites geográficos", () => {
  assert.equal(getCoordinatePair(-23.55, null), null);
  assert.equal(getCoordinatePair(91, -46.63), null);
  assert.equal(getCoordinatePair(-23.55, -181), null);
});
