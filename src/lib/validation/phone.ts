import { parsePhoneNumberFromString } from "libphonenumber-js/max";

// Confere o número contra o plano de numeração (DDD, quantidade de dígitos e
// prefixos válidos) e devolve no formato internacional, ex.: +5511987654321.
// Números brasileiros podem ser digitados sem o +55.
export function normalizePhone(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/(\d)\1{7,}/.test(value.replace(/\D/g, ""))) return null;
  const phone = parsePhoneNumberFromString(value, "BR");
  if (!phone || !phone.isValid()) return null;
  return phone.number;
}

export const invalidPhoneMessage =
  "Informe um telefone válido com DDD, por exemplo (11) 98765-4321.";
