import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;

export async function hashAdminPassword(password) {
  const value = String(password ?? "");

  if (value.length < 12 || value.length > 200) {
    throw new Error("A senha administrativa deve ter entre 12 e 200 caracteres.");
  }

  const salt = randomBytes(16);
  const derivedKey = await scrypt(value, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });

  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    Buffer.from(derivedKey).toString("base64url"),
  ].join("$");
}

export async function verifyAdminPassword(password, encodedHash) {
  try {
    const [algorithm, cost, blockSize, parallelization, saltValue, hashValue] =
      String(encodedHash ?? "").split("$");

    if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;

    const expected = Buffer.from(hashValue, "base64url");
    const derivedKey = await scrypt(
      String(password ?? ""),
      Buffer.from(saltValue, "base64url"),
      expected.length,
      {
        N: Number(cost),
        r: Number(blockSize),
        p: Number(parallelization),
        maxmem: MAX_MEMORY,
      },
    );
    const actual = Buffer.from(derivedKey);

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
