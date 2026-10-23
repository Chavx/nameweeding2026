export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ១. សម្រាប់រក្សាទុកឈ្មោះភ្ញៀវ (POST /api/invitations)
    if (path === '/api/invitations' && request.method === 'POST') {
      try {
        const body = await request.json();
        const name = body.name ? body.name.trim() : '';
        
        if (!name) {
          return new Response(JSON.stringify({ error: 'សូមបញ្ចូលឈ្មោះភ្ញៀវ' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // បង្កើត ID ពិសេសសម្រាប់ភ្ញៀវម្នាក់ៗ
        const uniqueId = crypto.randomUUID();

        // រក្សាទុកចូលក្នុង Cloudflare Workers KV (ដែលមាន Binding ឈ្មោះ INVITATIONS)
        await env.INVITATIONS.put(uniqueId, JSON.stringify({ name }));

        return new Response(JSON.stringify({ id: uniqueId, name }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // ២. សម្រាប់ទាញយកឈ្មោះភ្ញៀវតាម ID (GET /api/invitations/:id)
    if (path.startsWith('/api/invitations/') && request.method === 'GET') {
      const id = path.split('/').pop();
      if (!id) {
        return new Response(JSON.stringify({ error: 'រកមិនឃើញ ID ទេ' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      try {
        const dataString = await env.INVITATIONS.get(id);
        if (!dataString) {
          return new Response(JSON.stringify({ error: 'រកមិនឃើញទិន្នន័យកាតអញ្ជើញនេះទេ' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const data = JSON.parse(dataString);
        return new Response(JSON.stringify({ id, name: data.name }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // សម្រាប់ដំណើរការ Website ធម្មតា (Static Assets)
    return env.ASSETS.fetch(request);
  }
};
