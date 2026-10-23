
 // Cloudflare Pages Advanced Mode Worker
 // POST /api/invitations     -> Create a short invitation link
 // GET  /api/invitations/:id -> Read guest name from KV
 // Required KV binding: INVITATIONS

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Create a new invitation
    if (url.pathname === "/api/invitations") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      if (!env.INVITATIONS) {
        return json(
          { error: "KV binding INVITATIONS is not configured" },
          500
        );
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }

      const name =
        typeof body?.name === "string" ? body.name.trim() : "";

      if (!name) {
        return json({ error: "Guest name is required" }, 400);
      }

      if (name.length > 160) {
        return json({ error: "Guest name is too long" }, 400);
      }

      try {
        // Generate a short 12-character invitation ID
        for (let attempt = 0; attempt < 8; attempt++) {
          const id = crypto.randomUUID()
            .replaceAll("-", "")
            .slice(0, 12);

          const key = `invitation:${id}`;
          const existing = await env.INVITATIONS.get(key);

          if (existing !== null) continue;

          await env.INVITATIONS.put(
            key,
            JSON.stringify({ name })
          );

          return json({ id, name }, 201);
        }

        return json(
          { error: "Could not create a unique invitation ID" },
          500
        );
      } catch {
        return json(
          { error: "Could not save the invitation" },
          500
        );
      }
    }

    // Retrieve an invitation by its short ID
    const match = url.pathname.match(
      /^\/api\/invitations\/([a-f0-9]{12})$/i
    );

    if (match) {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405);
      }

      if (!env.INVITATIONS) {
        return json(
          { error: "KV binding INVITATIONS is not configured" },
          500
        );
      }

      try {
        const id = match[1].toLowerCase();

        const stored = await env.INVITATIONS.get(
          `invitation:${id}`
        );

        if (!stored) {
          return json({ error: "Invitation not found" }, 404);
        }

        const data = JSON.parse(stored);

        if (typeof data.name !== "string" || !data.name.trim()) {
          return json({ error: "Invitation data is invalid" }, 500);
        }

        return json({ id, name: data.name });
      } catch {
        return json(
          { error: "Could not read the invitation" },
          500
        );
      }
    }

    // Unknown API route
    if (url.pathname.startsWith("/api/")) {
      return json({ error: "API route not found" }, 404);
    }

    // Serve the website's static assets
    return env.ASSETS.fetch(request);
  },
};
