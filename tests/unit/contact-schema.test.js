import { describe, expect, it } from 'vitest';
import { contactSchema } from '../../src/lib/contact-schema.js';
import pt from '../../src/i18n/messages/pt.json';

const valid = { name: 'Ana Souza', email: 'ana@exemplo.com', message: 'Olá! Gostei do portfólio.' };

function errorsOf(data) {
  const result = contactSchema.safeParse(data);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
}

describe('schema do formulário de contato', () => {
  it('aceita dados válidos', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it('exige nome com 2 a 80 caracteres', () => {
    expect(errorsOf({ ...valid, name: 'A' }).name).toBe('contact.errors.nameMin');
    expect(errorsOf({ ...valid, name: 'A'.repeat(81) }).name).toBe('contact.errors.nameMax');
    expect(errorsOf({ ...valid, name: '  ' }).name).toBe('contact.errors.nameMin');
  });

  it('exige e-mail válido', () => {
    expect(errorsOf({ ...valid, email: 'ana@' }).email).toBe('contact.errors.emailInvalid');
    expect(errorsOf({ ...valid, email: '' }).email).toBe('contact.errors.emailInvalid');
  });

  it('exige mensagem com 10 a 2000 caracteres', () => {
    expect(errorsOf({ ...valid, message: 'curta' }).message).toBe('contact.errors.messageMin');
    expect(errorsOf({ ...valid, message: 'x'.repeat(2001) }).message).toBe(
      'contact.errors.messageMax',
    );
  });

  it('toda mensagem de erro tem tradução', () => {
    for (const key of ['nameMin', 'nameMax', 'emailInvalid', 'messageMin', 'messageMax']) {
      expect(pt.contact.errors[key]).toBeTruthy();
    }
  });
});
