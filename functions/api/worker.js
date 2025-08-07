const ALLOWED_ORIGINS = [
  'https://m2web.github.io',
  'http://127.0.0.1:5500'
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'POST') {
      console.log('[DEBUG] Entered POST handler');
    }
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

    // Check if the user's message contains keywords to trigger resume context
    let shouldIncludeResume = false;
    let userMessage = '';
    if (body && Array.isArray(body.messages)) {
      // Find the latest user message
      const lastUserMsg = [...body.messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg && lastUserMsg.content) {
        userMessage = lastUserMsg.content;
        // Only match 'Mark McFadden', 'Mr. McFadden', or 'Mark' (capitalized, standalone)
        const keywords = [/Mark\s+McFadden/, /Mr\.\s*McFadden/, /\bMark\b/];
        const matchResults = keywords.map(re => re.test(userMessage));
        shouldIncludeResume = matchResults.some(Boolean);
        console.log('[DEBUG] User message:', userMessage);
        console.log('[DEBUG] Regex match results:', matchResults);
      }
    }

    if (shouldIncludeResume) {
      // Fetch succinct resume from KV and add as a system message
      let succinctResume = await env.RESUME.get('RESUME_SUCCINCT');
      if (succinctResume) {
        let resumeObj;
        try {
          resumeObj = JSON.parse(succinctResume);
        } catch (e) {
          resumeObj = null;
        }
        let summary = resumeObj && resumeObj.summary ? resumeObj.summary.join(' ') : '';
        let titles = resumeObj && resumeObj.experience_titles ? resumeObj.experience_titles.join(', ') : '';
        let systemMsg = `Resume for Mark McFadden. Summary: ${summary} Experience titles: ${titles}`;
        // Prepend system message
        if (body && Array.isArray(body.messages)) {
          body.messages = [
            { role: 'system', content: systemMsg },
            ...body.messages
          ];
          // Log the system message and a flag for debugging
          console.log('[RESUME INJECTED]', systemMsg);
          console.log('[DEBUG] Full messages array:', JSON.stringify(body.messages));
        }
      }
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