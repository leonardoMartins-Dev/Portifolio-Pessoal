#!/usr/bin/env node
/**
 * Gera o SPOTIFY_REFRESH_TOKEN (fluxo Authorization Code).
 *
 *   1. No painel do app (developer.spotify.com/dashboard), cadastre a Redirect URI
 *      http://127.0.0.1:8888/callback  (o Spotify não aceita "localhost").
 *   2. Coloque SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env.local.
 *   3. Rode `npm run spotify:token`, autorize no navegador e copie o token impresso.
 *
 * O refresh token expira 6 meses após a autorização: rode de novo antes disso.
 */
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = 'user-read-currently-playing user-read-recently-played user-top-read';

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Arquivo inexistente: segue com as variáveis do ambiente.
  }
}

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('✗ Defina SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env.local antes de rodar.');
  process.exit(1);
}

const state = randomBytes(16).toString('hex');
const authorizeUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
  state,
})}`;

function page(title, body) {
  return `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="font-family:system-ui;background:#0e0f14;color:#eceef4;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center"><h1 style="font-size:20px">${title}</h1><p style="color:#a2a7b6">${body}</p></div></body>`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end();
    return;
  }
  const html = { 'content-type': 'text/html; charset=utf-8' };

  if (url.searchParams.get('state') !== state) {
    res.writeHead(400, html).end(page('Estado inválido', 'Rode o script de novo.'));
    return;
  }
  const error = url.searchParams.get('error');
  if (error) {
    res.writeHead(400, html).end(page('Autorização negada', error));
    console.error(`✗ Autorização negada: ${error}`);
    server.close();
    return;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: url.searchParams.get('code'),
        redirect_uri: REDIRECT_URI,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description ?? data.error ?? response.status);

    res.writeHead(200, html).end(page('Pronto!', 'Volte ao terminal para copiar o token.'));
    const expires = new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
    console.log('\n✓ Coloque no .env.local e nas variáveis de ambiente da Vercel:\n');
    console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`);
    console.log(
      `⚠ Este token expira em 6 meses (por volta de ${expires}). Rode o script de novo antes.`,
    );
  } catch (err) {
    res.writeHead(500, html).end(page('Erro ao gerar o token', String(err.message)));
    console.error(`✗ Erro ao trocar o código pelo token: ${err.message}`);
  } finally {
    server.close();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Abra no navegador para autorizar:\n\n  ${authorizeUrl}\n`);
  const opener =
    process.platform === 'darwin'
      ? ['open', [authorizeUrl]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', authorizeUrl]]
        : ['xdg-open', [authorizeUrl]];
  execFile(...opener, () => {});
});
