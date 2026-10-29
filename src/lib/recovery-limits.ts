// Recuperação de senha: até 3 envios por hora para o mesmo e-mail ou CPF, com
// 3 minutos entre eles. O servidor aplica (actions/auth.ts); a tela usa os
// mesmos números para a contagem e para esconder o botão no fim.
export const recoveryMaxSends = 3;
export const recoveryCooldownSeconds = 180;
