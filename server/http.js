/** Resposta JSON com cabeçalhos extras. */
export function json(data, { status = 200, headers = {} } = {}) {
  return Response.json(data, { status, headers });
}

/** IP do visitante (a Vercel informa em x-forwarded-for). */
export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'anonymous';
}
