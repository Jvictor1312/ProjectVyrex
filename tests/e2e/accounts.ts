import path from "node:path";

// Contas de teste (descartáveis, serão excluídas ao fim do projeto). E-mail e
// senha vêm de variáveis de ambiente do Windows; nunca ficam no código.
export const accounts = {
  admin: {
    email: process.env.VYREX_TEST_ADMIN_EMAIL,
    password: process.env.VYREX_TEST_ADMIN_PASSWORD,
    home: /\/interno/,
  },
  user: {
    email: process.env.VYREX_TEST_USER_EMAIL,
    password: process.env.VYREX_TEST_USER_PASSWORD,
    home: /\/dashboard/,
  },
} as const;

export type AccountName = keyof typeof accounts;

export function storageFile(name: AccountName) {
  return path.join("playwright", ".auth", `${name}.json`);
}

export function hasAccount(name: AccountName) {
  return Boolean(accounts[name].email && accounts[name].password);
}
