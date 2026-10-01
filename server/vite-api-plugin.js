import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Plugin do Vite que serve as funções de `api/*.js` em `npm run dev` e
 * `npm run preview`, imitando as Vercel Functions (handlers Web: GET/POST).
 * Em produção quem serve `/api` é a própria Vercel.
 */
export function apiDevServer() {
  let loadModule;

  async function handle(req, res, next) {
    if (!req.url?.startsWith('/api/')) return next();

    const route = req.url
      .split('?')[0]
      .replace(/^\/api\//, '')
      .replace(/\/$/, '');
    const file = path.resolve('api', `${route}.js`);
    if (!/^[\w-]+$/.test(route) || !existsSync(file)) {
      res.statusCode = 404;
      return res.end('Not found');
    }

    try {
      const mod = await loadModule(file);
      const handler = mod[req.method] ?? mod.default?.fetch;
      if (typeof handler !== 'function') {
        res.statusCode = 405;
        return res.end('Method not allowed');
      }
      const response = await handler(await toWebRequest(req));
      await sendWebResponse(res, response);
    } catch (error) {
      console.error(`[api] erro em /api/${route}:`, error);
      res.statusCode = 500;
      res.end('Internal error');
    }
  }

  return {
    name: 'portifolio:api-dev-server',
    configureServer(server) {
      loadModule = (file) => server.ssrLoadModule(file);
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      loadModule = (file) => import(`${file}?t=${Date.now()}`);
      server.middlewares.use(handle);
    },
  };
}

async function toWebRequest(req) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value != null) headers.set(key, value);
  }
  // O IP do visitante, como a Vercel informa em produção.
  if (!headers.has('x-forwarded-for') && req.socket?.remoteAddress) {
    headers.set('x-forwarded-for', req.socket.remoteAddress);
  }

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }
  return new Request(url, { method: req.method, headers, body });
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) return res.end();
  // Repassa o corpo em pedaços, para o streaming do assistente funcionar.
  for await (const chunk of response.body) res.write(chunk);
  res.end();
}
