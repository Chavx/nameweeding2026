// GET /api/invitations/:id
// Retrieves one guest invitation from the Cloudflare KV namespace bound as INVITATIONS.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet({ params, env }) {
  if (!env.INVITATIONS) {
    return json({
      error: "KV binding INVITATIONS is not configured. Add it in Cloudflare Pages Settings > Bindings."
    }, 500);
  }

  const id = typeof params?.id === "string" ? params.id.trim() : "";
  if (!id || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
    return json({ error: "Invalid invitation ID." }, 400);
  }

  try {
    const value = await env.INVITATIONS.get(id);
    if (!value) {
      return json({ error: "Invitation not found." }, 404);
    }

    const record = JSON.parse(value);
    return json({ id, name: record.name || "ភ្ញៀវកិត្តិយស" });
  } catch (error) {
    return json({ error: "Could not read invitation from storage." }, 500);
  }
}
