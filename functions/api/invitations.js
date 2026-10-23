// POST /api/invitations
// Creates a guest invitation record in the Cloudflare KV namespace bound as INVITATIONS.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.INVITATIONS) {
    return json({
      error: "KV binding INVITATIONS is not configured. Add it in Cloudflare Pages Settings > Bindings."
    }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return json({ error: "Guest name is required." }, 400);
  }
  if (name.length > 200) {
    return json({ error: "Guest name must be 200 characters or fewer." }, 400);
  }

  const id = crypto.randomUUID().replaceAll("-", "").slice(0, 20);
  const record = {
    id,
    name,
    createdAt: new Date().toISOString(),
  };

  try {
    await env.INVITATIONS.put(id, JSON.stringify(record));
    return json({ id, name }, 201);
  } catch (error) {
    return json({ error: "Could not save invitation. Check the INVITATIONS KV binding." }, 500);
  }
}

