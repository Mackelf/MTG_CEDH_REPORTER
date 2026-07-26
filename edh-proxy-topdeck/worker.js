export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ALLOWED_ORIGIN = 'https://mackelf.github.io';

    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const tid = url.searchParams.get('tid');
    const playerId = url.searchParams.get('playerId');
    if (!tid) {
      return new Response(JSON.stringify({ error: 'Falta parámetro tid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tdPath = playerId
      ? `https://topdeck.gg/api/v2/tournaments/${tid}/players/${playerId}`
      : `https://topdeck.gg/api/v2/tournaments/${tid}`;

    // NUEVO: try/catch para que CUALQUIER error (fetch caído, env var faltante, etc.)
    // siempre devuelva corsHeaders en vez de dejar que el Worker reviente sin ellos.
    try {
      if (!env.TOPDECK_API_KEY) {
        return new Response(JSON.stringify({ error: 'TOPDECK_API_KEY no configurada en el Worker' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tdRes = await fetch(tdPath, {
        headers: {
          'Authorization': env.TOPDECK_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      const data = await tdRes.text();
      return new Response(data, {
        status: tdRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Error interno del proxy', detail: String(err) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};