import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Cifra o token do Instagram antes de gravá-lo no banco (AES-256-GCM). Mesmo
// que alguém leia a tabela, sem a chave do servidor o token não serve.
// Formato: v1.<iv>.<tag>.<texto cifrado>, tudo em base64url.

const version = "v1";

export function parseTokenKey(value: string | undefined): Buffer | null {
  if (!value) return null;
  const key = Buffer.from(value.trim(), "base64");
  return key.length === 32 ? key : null;
}

export function encryptToken(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    version,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptToken(sealed: string, key: Buffer): string {
  const [prefix, iv, tag, encrypted] = sealed.split(".");
  if (prefix !== version || !iv || !tag || !encrypted) {
    throw new Error("Invalid sealed token");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
