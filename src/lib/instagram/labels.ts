// Textos da verificação de métricas do Instagram, usados pelo criador e
// pela equipe. Métrica indisponível nunca aparece como número verificado.

export const verificationSourceLabels = {
  api: "Verificado pela API do Instagram",
  manual: "Informado pelo criador",
  recording: "Gravação de tela (conferência da equipe)",
} as const;

export const connectionStatusLabels: Record<string, string> = {
  active: "Conectado",
  reconnect_required: "Precisa conectar de novo",
  revoked: "Acesso removido no Instagram",
  disconnected: "Desconectado",
};

export const unavailableReasonLabels: Record<string, string> = {
  permission_missing: "Sem permissão para métricas (conceda o acesso às estatísticas ao conectar)",
  not_enough_viewers: "Poucos espectadores; o Instagram só mostra a partir de 5",
  not_supported: "O Instagram não oferece esta métrica para esta conta",
  no_data: "O Instagram não informou este dado",
  rate_limited: "Consulta limitada pelo Instagram no momento",
  error: "Não foi possível consultar",
};

export const syncErrorLabels: Record<string, string> = {
  rate_limit: "A última atualização foi limitada pelo Instagram.",
  network: "A última atualização não conseguiu falar com o Instagram.",
  permission: "A conta não deu permissão para parte das métricas.",
  unknown: "A última atualização falhou.",
  error: "A última atualização falhou.",
};

export const accountTypeLabels: Record<string, string> = {
  BUSINESS: "Conta comercial",
  MEDIA_CREATOR: "Conta de criador de conteúdo",
  CREATOR: "Conta de criador de conteúdo",
};

export const recordingStatusLabels: Record<string, string> = {
  pending: "Aguardando conferência",
  approved: "Aprovada pela equipe",
  rejected: "Recusada pela equipe",
};

export const recordingStatusTones: Record<string, "neutral" | "success" | "danger"> = {
  pending: "neutral",
  approved: "success",
  rejected: "danger",
};

// Avisos depois de voltar da tela do Instagram (?instagram=...).
export const connectionNotices: Record<string, { message: string; success: boolean }> = {
  conectado: { message: "Instagram conectado. As métricas foram consultadas.", success: true },
  cancelado: { message: "Conexão cancelada. Nada foi alterado.", success: false },
  expirado: {
    message: "A conexão demorou demais ou foi aberta em outra sessão. Tente de novo.",
    success: false,
  },
  falhou: {
    message:
      "Não foi possível conectar. Confira se a conta é profissional (comercial ou de criador) e tente de novo.",
    success: false,
  },
  "em-uso": {
    message: "Esta conta do Instagram já está conectada a outro cadastro da Vyrex.",
    success: false,
  },
  indisponivel: {
    message: "A conexão com o Instagram ainda não está disponível. Use a gravação de tela.",
    success: false,
  },
  bloqueado: {
    message: "A conexão só pode ser feita enquanto o cadastro está em edição.",
    success: false,
  },
};

export function formatCount(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("pt-BR") : null;
}

export function formatDuration(seconds: number) {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes ? `${minutes} min ${rest.toString().padStart(2, "0")} s` : `${rest} s`;
}
