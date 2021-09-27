import { webcrypto } from "crypto";
const { subtle } = webcrypto as any;
//const { subtle } = require("crypto").webcrypto;

const encryptPassword = "password + password";
const salt_len = 18;
const iv_len = 12;

function getKeyMaterial() {
  return subtle.importKey("raw", new TextEncoder().encode(encryptPassword), { name: "PBKDF2" }, false, [
    "deriveBits",
    "deriveKey",
  ]);
}

function getKey(keyMaterial: CryptoKey, salt: Uint8Array) {
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function decryptWeb(sourceText: string) {
  const encrypted = Buffer.from(sourceText, "base64");

  const salt = encrypted.slice(0, salt_len);
  const iv = encrypted.slice(salt_len, salt_len + iv_len);

  const keyMaterial = await getKeyMaterial();
  const key = await getKey(keyMaterial, salt);
  const ciphertext = encrypted.slice(salt_len + iv_len);

  try {
    const decrypted = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return "";
  }
}
