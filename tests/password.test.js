import assert from "node:assert/strict";
import test from "node:test";

import { hashAdminPassword, verifyAdminPassword } from "../lib/password.js";

test("administrative passwords are salted and verified", async () => {
  const password = "uma-senha-segura-123";
  const firstHash = await hashAdminPassword(password);
  const secondHash = await hashAdminPassword(password);

  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyAdminPassword(password, firstHash), true);
  assert.equal(await verifyAdminPassword("senha-incorreta", firstHash), false);
});

test("short administrative passwords are rejected", async () => {
  await assert.rejects(
    () => hashAdminPassword("curta"),
    /entre 12 e 200 caracteres/,
  );
});
