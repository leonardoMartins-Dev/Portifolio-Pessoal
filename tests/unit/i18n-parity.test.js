import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/messages/en.json';
import pt from '../../src/i18n/messages/pt.json';

function flatten(messages, prefix = '') {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [[path, value]] : flatten(value, path);
  });
}

const placeholders = (text) => (text.match(/{{\s*\w+\s*}}/g) ?? []).sort();

describe('mensagens de i18n', () => {
  it('pt.json e en.json têm exatamente as mesmas chaves', () => {
    const ptKeys = flatten(pt)
      .map(([key]) => key)
      .sort();
    const enKeys = flatten(en)
      .map(([key]) => key)
      .sort();
    expect(enKeys).toEqual(ptKeys);
  });

  it('nenhuma mensagem está vazia', () => {
    const empty = [...flatten(pt), ...flatten(en)].filter(([, value]) => !value.trim());
    expect(empty).toEqual([]);
  });

  it('as duas versões usam as mesmas variáveis de interpolação', () => {
    const enMap = Object.fromEntries(flatten(en));
    for (const [key, value] of flatten(pt)) {
      expect(placeholders(enMap[key]), key).toEqual(placeholders(value));
    }
  });
});
