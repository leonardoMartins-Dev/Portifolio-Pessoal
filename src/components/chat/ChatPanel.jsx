import { useChat } from '@ai-sdk/react';
import { ArrowUp, Bot, Check, MessageSquarePlus, Square, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { projects } from '../../content/projects.js';
import { assistantChat, chatErrorCode, fetchAssistantAvailability } from '../../lib/ai/chat.js';
import { getAppMeta, isAppId } from '../../lib/apps-meta.js';
import { useLocalized } from '../../lib/hooks.js';
import { navigateToApp } from '../../lib/os-bridge.js';
import { siteConfig } from '../../site.config.js';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { Markdown } from './Markdown.jsx';

export const MAX_INPUT_CHARS = 500;
const SUGGESTIONS = ['projects', 'react', 'contact', 'howTo'];

/** Disponibilidade do assistente (GET /api/chat), com cache. */
function useAvailability() {
  const [available, setAvailable] = useState(null);
  useEffect(() => {
    let active = true;
    fetchAssistantAvailability().then((value) => active && setAvailable(value));
    return () => {
      active = false;
    };
  }, []);
  return available;
}

/**
 * Conversa com o assistente. Usado no app Assistente e no lançador (Ctrl/⌘K);
 * os dois compartilham a mesma conversa.
 */
export function ChatPanel({ compact = false, autoFocus = false, footer }) {
  const { t } = useTranslation();
  const available = useAvailability();
  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({
    chat: assistantChat,
  });
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (autoFocus && available) inputRef.current?.focus();
  }, [autoFocus, available]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, status]);

  function send(text) {
    const value = text.trim();
    if (!value || busy || value.length > MAX_INPUT_CHARS) return;
    clearError();
    sendMessage({ text: value });
    setInput('');
  }

  if (available === null) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="size-5 text-muted" label={t('common.loading')} />
      </div>
    );
  }

  if (!available) {
    return (
      <EmptyState icon={Bot} title={t('assistant.unavailable')} className="h-full">
        <button
          type="button"
          onClick={() => navigateToApp('contact')}
          className="font-medium text-accent-ink hover:underline"
        >
          {t('assistant.errorContact')}
        </button>
      </EmptyState>
    );
  }

  const errorCode = chatErrorCode(error);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`scroll-area flex-1 overflow-y-auto ${compact ? 'max-h-[50vh] px-4 py-3' : 'px-4 py-4 sm:px-5'}`}
      >
        {messages.length === 0 ? (
          <Welcome onPick={send} compact={compact} />
        ) : (
          <ol aria-live="polite" aria-busy={busy} className="flex flex-col gap-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {status === 'submitted' && (
              <li className="flex items-center gap-2 text-sm text-muted">
                <Spinner />
                {t('assistant.thinking')}
              </li>
            )}
          </ol>
        )}
        {errorCode && <ChatError code={errorCode} />}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="border-t border-border p-3"
      >
        <div className="flex items-end gap-2 rounded-md border border-border bg-surface-2 p-1.5 focus-within:border-accent">
          <label htmlFor={compact ? 'chat-input-launcher' : 'chat-input'} className="sr-only">
            {t('assistant.inputLabel')}
          </label>
          <input
            ref={inputRef}
            id={compact ? 'chat-input-launcher' : 'chat-input'}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MAX_INPUT_CHARS}
            placeholder={t('assistant.placeholder')}
            autoComplete="off"
            className="min-h-9 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted"
          />
          {messages.length > 0 && !busy && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                clearError();
              }}
              aria-label={t('assistant.newChat')}
              title={t('assistant.newChat')}
              className="grid size-9 place-items-center rounded-[8px] text-muted hover:bg-border hover:text-text"
            >
              <MessageSquarePlus className="size-4" />
            </button>
          )}
          {busy ? (
            <button
              type="button"
              onClick={stop}
              aria-label={t('assistant.stop')}
              className="grid size-9 place-items-center rounded-[8px] bg-text text-surface"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label={t('assistant.send')}
              className="grid size-9 place-items-center rounded-[8px] bg-accent text-accent-contrast disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3 px-1 text-[11px] text-muted">
          <span>{t('assistant.disclaimer')}</span>
          {footer}
        </div>
      </form>
    </div>
  );
}

function Welcome({ onPick, compact }) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-4 ${compact ? '' : 'pt-6'}`}>
      {!compact && (
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="grid size-12 place-items-center rounded-md bg-accent-soft text-accent-ink">
            <Bot aria-hidden className="size-6" />
          </span>
        </div>
      )}
      <p className={`text-sm text-muted ${compact ? '' : 'text-center'}`}>
        {t('assistant.intro', { name: siteConfig.author.firstName })}
      </p>
      <ul aria-label={t('assistant.suggestionsLabel')} className="flex flex-col gap-2">
        {SUGGESTIONS.map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onPick(t(`assistant.suggestions.${key}`))}
              className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2.5 text-left text-sm hover:border-accent"
            >
              {t(`assistant.suggestions.${key}`)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatMessage({ message }) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  return (
    <li className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
      <span className="sr-only">{isUser ? t('assistant.you') : t('assistant.bot')}:</span>
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          if (!part.text) return null;
          return isUser ? (
            <p
              key={index}
              className="max-w-[85%] rounded-md rounded-br-[6px] bg-accent px-3 py-2 text-sm whitespace-pre-wrap text-accent-contrast"
            >
              {part.text}
            </p>
          ) : (
            <div
              key={index}
              className="max-w-[92%] rounded-md rounded-bl-[6px] bg-surface-2 px-3 py-2"
            >
              <Markdown>{part.text}</Markdown>
            </div>
          );
        }
        if (part.type.startsWith('tool-')) {
          return <ToolChip key={part.toolCallId ?? index} part={part} />;
        }
        return null;
      })}
    </li>
  );
}

/** Mostra a ação que o assistente executou no sistema (ex.: "Abrindo Projetos ✓"). */
function ToolChip({ part }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const name = part.type.slice('tool-'.length);
  const input = part.input ?? {};
  const done = part.state === 'output-available';

  let label = t('assistant.tools.running');
  if (name === 'openApp' && isAppId(input.appId)) {
    label = t('assistant.tools.openApp', { app: l(getAppMeta(input.appId).title) });
  } else if (name === 'showProject') {
    const project = projects.find((item) => item.id === input.projectId);
    label = t('assistant.tools.showProject', { project: project?.name ?? input.projectId ?? '' });
  } else if (name === 'setLanguage' && input.locale) {
    label = t('assistant.tools.setLanguage', { language: t(`languages.names.${input.locale}`) });
  } else if (name === 'setTheme' && input.theme) {
    label = t('assistant.tools.setTheme', { theme: t(`theme.${input.theme}`).toLowerCase() });
  }

  return (
    <p className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted">
      {done ? (
        <Check aria-hidden className="size-3 text-success" />
      ) : (
        <Spinner className="size-3" />
      )}
      {label}
    </p>
  );
}

function ChatError({ code }) {
  const { t } = useTranslation();
  const text = {
    rate_limited: t('assistant.rateLimited'),
    unavailable: t('assistant.unavailable'),
    too_long: t('assistant.tooLong'),
    error: t('assistant.error'),
  }[code];

  return (
    <div
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm"
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
      <div>
        <p>{text}</p>
        {code === 'error' && (
          <button
            type="button"
            onClick={() => navigateToApp('contact')}
            className="mt-1 font-medium text-accent-ink hover:underline"
          >
            {t('assistant.errorContact')}
          </button>
        )}
      </div>
    </div>
  );
}
