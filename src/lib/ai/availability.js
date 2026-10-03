let availability = null;

/**
 * O servidor tem a chave do Gemini? (GET /api/chat; resultado em cache)
 * Fica fora de chat.js para a tela de bloqueio não puxar o SDK de IA.
 */
export function fetchAssistantAvailability() {
  availability ??= fetch('/api/chat', { headers: { accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : { available: false }))
    .then((data) => Boolean(data.available))
    .catch(() => false);
  return availability;
}
