import { z } from 'zod';

export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  message: { min: 10, max: 2000 },
};

/**
 * Schema do formulário de Contato. As mensagens de erro são chaves de i18n
 * (traduzidas na hora de exibir), para o schema não depender do idioma.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.name.min, 'contact.errors.nameMin')
    .max(CONTACT_LIMITS.name.max, 'contact.errors.nameMax'),
  email: z.string().trim().pipe(z.email('contact.errors.emailInvalid')),
  message: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.message.min, 'contact.errors.messageMin')
    .max(CONTACT_LIMITS.message.max, 'contact.errors.messageMax'),
  // Honeypot: invisível para pessoas; robôs costumam preencher.
  website: z.string().optional(),
});
