/**
 * EmailJS (§12.4). As variáveis VITE_EMAILJS_* são públicas por design;
 * restrinja os domínios permitidos no painel do EmailJS.
 */
export const emailConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateForMe: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FOR_ME,
  templateForSender: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FOR_SENDER,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

export function isEmailConfigured(config = emailConfig) {
  return Boolean(
    config.serviceId && config.templateForMe && config.templateForSender && config.publicKey,
  );
}

/**
 * Envia os dois e-mails, como no guia do professor:
 * FOR ME (notificação para o autor) e FOR SENDER (confirmação para o remetente).
 * Variáveis dos templates: {{name}}, {{email}}, {{message}}, {{title}}, {{time}}.
 */
export async function sendContactEmails({ name, email, message, time, titles }) {
  // Carrega o SDK só na hora do envio.
  const emailjs = await import('@emailjs/browser');
  const base = { name, email, message, time };
  const options = { publicKey: emailConfig.publicKey };
  await emailjs.send(
    emailConfig.serviceId,
    emailConfig.templateForMe,
    { ...base, title: titles.forMe },
    options,
  );
  await emailjs.send(
    emailConfig.serviceId,
    emailConfig.templateForSender,
    { ...base, title: titles.forSender },
    options,
  );
}

/** "5531987451563" → "+55 (31) 98745-1563" (formato brasileiro; senão, +dígitos). */
export function formatPhone(digits) {
  const match = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  return match ? `+55 (${match[1]}) ${match[2]}-${match[3]}` : `+${digits}`;
}
