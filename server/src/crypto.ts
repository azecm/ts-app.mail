import * as crypto from "crypto";

const encryptPassword = "backEnd Password";
const salt_len = 16;
const iv_len = 16;

export function decryptText(sourceText: string): string {
  const encrypted = Buffer.from(sourceText, "base64");

  const salt = encrypted.slice(0, salt_len);
  const iv = encrypted.slice(salt_len, salt_len + iv_len);
  const key = crypto.pbkdf2Sync(encryptPassword, salt, 100000, 256 / 8, "sha256");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  decipher.write(encrypted.slice(salt_len + iv_len));
  decipher.end();

  const decrypted = decipher.read();
  return decrypted.toString();
}

export function encryptText(textPhrase: string): string {
  const salt = crypto.randomBytes(salt_len);
  const iv = crypto.randomBytes(iv_len);
  const key = crypto.pbkdf2Sync(encryptPassword, salt, 100000, 256 / 8, "sha256");

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  cipher.write(textPhrase);
  cipher.end();

  const encrypted = cipher.read();

  return Buffer.concat([salt, iv, encrypted]).toString("base64");
}
