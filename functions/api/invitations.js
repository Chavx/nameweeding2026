export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 200)
    return Response.json({ error: "Guest name is required (max 200 characters)" }, { status: 400 });
  if (!env.INVITATIONS)
    return Response.json({ error: "KV binding INVITATIONS is not configured" }, { status: 500 });

  const bytes = crypto.getRandomValues(new Uint8Array(9));
  const id = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  await env.INVITATIONS.put(`invite:${id}`, JSON.stringify({ name, createdAt: new Date().toISOString() }));
  return Response.json({ id }, { status: 201 });
}
