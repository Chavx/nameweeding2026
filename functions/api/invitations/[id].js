export async function onRequestGet({ params, env }) {
  if (!env.INVITATIONS)
    return Response.json({ error: "KV binding INVITATIONS is not configured" }, { status: 500 });
  const record = await env.INVITATIONS.get(`invite:${params.id}`);
  if (!record) return Response.json({ error: "Invitation not found" }, { status: 404 });
  return new Response(record, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
