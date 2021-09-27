import { toBase64 } from "./utils";

const password = "password + password";
const salt_len = 18;
const iv_len = 12;

function getKeyMaterial() {
  return window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, [
    "deriveBits",
    "deriveKey",
  ]);
}

function getKey(keyMaterial: CryptoKey, salt: Uint8Array) {
  return window.crypto.subtle.deriveKey(
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

export async function encrypt(message: string) {
  const keyMaterial = await getKeyMaterial();
  const salt = window.crypto.getRandomValues(new Uint8Array(salt_len));
  const key = await getKey(keyMaterial, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(iv_len));
  const encoded = new TextEncoder().encode(message);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded,
  );

  return toBase64([...salt, ...iv, ...new Uint8Array(ciphertext)]);
}

function unpack(packed: string) {
  const string = window.atob(packed);
  const buffer = new ArrayBuffer(string.length);
  const bufferView = new Uint8Array(buffer);
  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }
  return buffer;
}

export async function decrypt(source: string) {
  const encrypted = new Uint8Array(unpack(source));
  const salt = encrypted.slice(0, salt_len);
  const iv = encrypted.slice(salt_len, salt_len + iv_len);

  const keyMaterial = await getKeyMaterial();
  const key = await getKey(keyMaterial, salt);
  const ciphertext = encrypted.slice(salt_len + iv_len);

  try {
    let decrypted = await window.crypto.subtle.decrypt(
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
