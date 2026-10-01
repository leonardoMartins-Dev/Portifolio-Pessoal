import ReactMarkdown from 'react-markdown';
import { LOCALES } from '../../i18n/locales.js';
import { isAppId } from '../../lib/apps-meta.js';
import { navigateToApp } from '../../lib/os-bridge.js';

const ALLOWED = ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'br'];

/** Link interno do sistema? (/pt/projects, /en/contact…) → abre o app em vez de recarregar. */
function internalApp(href = '') {
  const [locale, appId, ...rest] = href.split('?')[0].split('/').filter(Boolean);
  if (!href.startsWith('/') || rest.length || !LOCALES.includes(locale) || !isAppId(appId)) {
    return null;
  }
  return { appId, search: href.includes('?') ? `?${href.split('?')[1]}` : '' };
}

/** Markdown simples nas respostas do assistente, com links clicáveis. */
export function Markdown({ children }) {
  return (
    <div className="markdown text-sm leading-relaxed">
      <ReactMarkdown
        allowedElements={ALLOWED}
        unwrapDisallowed
        skipHtml
        components={{
          a({ href, children: label }) {
            const internal = internalApp(href);
            if (internal) {
              return (
                <a
                  href={href}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToApp(internal.appId, internal.search);
                  }}
                >
                  {label}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
