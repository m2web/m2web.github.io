const ALLOWED_ORIGINS = [
  'https://m2web.github.io',
  'http://127.0.0.1:5500'
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Handle CORS pre-flight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Serve resume.json from KV at /api/resume
    if (request.method === 'GET' && url.pathname === '/api/resume') {
      const origin = request.headers.get('Origin');
      let corsHeaders = {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        corsHeaders['Access-Control-Allow-Origin'] = origin;
        corsHeaders['Vary'] = 'Origin';
      }
      let data;
      try {
  data = await env.RESUME.get('RESUME'); // Use uppercase key
      } catch (err) {
        console.error('Error accessing resume data:', err);
        return new Response(
          'Error accessing resume data: ' + (err && err.message ? err.message : String(err)),
          { status: 500, headers: corsHeaders }
        );
      }
      if (!data) {
        return new Response('Resume not found', { status: 404, headers: corsHeaders });
      }
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Proxy requests to the OpenAI Chat Completions API:
    // - Forwards the request body to OpenAI with the API key from the environment
    // - Handles authentication and error responses
    // - Adds appropriate CORS headers to the response
    if (!env.OPENAI_API_KEY) {
      return new Response('Missing OpenAI API key in environment variables.', { status: 500 });
    }

    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    // Ensure the request body is valid JSON
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response('Invalid JSON in request body', { status: 400 });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    // Add CORS headers to the response
    const newHeaders = new Headers(response.headers);
    const origin = request.headers.get('Origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      newHeaders.set('Access-Control-Allow-Origin', origin);
      newHeaders.set('Vary', 'Origin');
    }
    newHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  }
};

function handleOptions(request) {
  const headers = request.headers;
  const origin = headers.get('Origin');
  if (
    origin !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    let corsHeaders = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (ALLOWED_ORIGINS.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
      corsHeaders['Vary'] = 'Origin';
    }
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    // Handle non-CORS pre-flight request.
    return new Response(null, {
      headers: {
        Allow: 'POST, OPTIONS',
      },
    });
  }
}