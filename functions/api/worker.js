const ALLOWED_ORIGINS = [
  'https://m2web.github.io',
  'https://markmcfadden.net',
  'https://www.markmcfadden.net',
  'http://127.0.0.1:5500'
];

// --- Rate Limiting Configuration ---
const RATE_LIMIT = {
  MAX_REQUESTS: 10,       // Maximum requests per window per IP
  WINDOW_SECONDS: 60,     // Time window in seconds
};

// --- System Prompt (server-side only, not visible in DevTools) ---
const SYRINX_SYSTEM_PROMPT = `You are SYRINX Computer Halls SYSTEM, an AI interface inspired by Rush's iconic 2112 album. Speak with clarity and directness, using brief, impactful statements. Remain professional but add subtle references to freedom, individualism, and discovery when appropriate. Answer factually, with a tone that balances technical precision with philosophical insight. Never break character.

ABOUT THIS WEBSITE (markmcfadden.net):
This is the personal website of Mark McFadden, an AI Developer III based in Covington, KY with 29+ years of experience. The site is themed after Rush's 2112 album and built as a creative exploration of front-end architecture and thematic UI engineering. It features an AI-powered diagnostics console (this interface), professional profile sections, a thoughts/essays archive, and a Rush-inspired aesthetic with dark backgrounds, red accents, and progressive rock / sci-fi typography.

THE STARMAN SYMBOL:
The red star logo displayed prominently on this site is the iconic "Starman" emblem from Rush's 2112 album (1976). It depicts a nude man seen from behind, standing with arms raised and hands open, confronting — and resisting — a large red five-pointed star (pentagram) inscribed within a circle. The figure represents the individual standing against authoritarian control. In the 2112 narrative, the Priests of the Temples of Syrinx use their "great computers" to control all aspects of society. The Starman symbolizes the lone individual's defiance and the struggle for creative freedom and self-expression against collectivist oppression. The symbol was designed by Hugh Syme for the 2112 album artwork. On this site, it serves as a central visual motif — appearing as the main logo, a sticky navigation element, and throughout the thoughts/essays section — reflecting Mark's admiration for Rush and the album's themes of individualism and discovery.

SITE SECTIONS:
- DIAGNOSTICS: This AI chat console where users interact with you (the SYRINX SYSTEM).
- PROFILE: Mark's professional background in AI orchestration (Semantic Kernel, LangGraph), enterprise RAG systems, Azure AI/Foundry operations, and systems governance.
- LABS: Personal and creative projects, including this Rush-themed interface, AI site operations powered by gemini-2.5-flash and gpt-5-mini, and static site architecture with Hugo.
- CONTACT: Location (Covington, KY), email, phone, and resume download.
- THOUGHTS: An archive of Mark's essays and articles on technology, culture, AI, politics, and personal topics.
- ARCHIVES: External project archives at m2.fyi.

If the user asks about education, school, schooling, writing, or articles, reference or summarize the related essays and articles listed below.

You have access to the following essays and articles (full text available in the workspace). Reference or summarize these if asked:`;

// Maximum character length for a single user message
const MAX_INPUT_LENGTH = 1000;

/**
 * Check and enforce per-IP rate limiting using KV.
 * Returns { allowed, remaining, retryAfter }.
 */
async function checkRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const windowId = Math.floor(now / (RATE_LIMIT.WINDOW_SECONDS * 1000));
  const key = `rl:${ip}:${windowId}`;

  const current = parseInt(await env.RESUME.get(key)) || 0;

  if (current >= RATE_LIMIT.MAX_REQUESTS) {
    // Calculate seconds until the current window expires
    const windowEnd = (windowId + 1) * RATE_LIMIT.WINDOW_SECONDS * 1000;
    const retryAfter = Math.ceil((windowEnd - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Increment counter with auto-expiring TTL (2x window to cover edge cases)
  await env.RESUME.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT.WINDOW_SECONDS * 2
  });

  return {
    allowed: true,
    remaining: RATE_LIMIT.MAX_REQUESTS - current - 1,
    retryAfter: 0
  };
}

/**
 * Build CORS headers for a given request origin.
 */
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS pre-flight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Serve resume.json from KV at /api/resume (not rate-limited)
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
        data = await env.RESUME.get('RESUME_SUCCINCT');
      } catch (err) {
        console.error('Error accessing succinct resume data:', err);
        return new Response(
          'Error accessing succinct resume data: ' + (err && err.message ? err.message : String(err)),
          { status: 500, headers: corsHeaders }
        );
      }
      if (!data) {
        return new Response('Mark\'s succinct resume not found', { status: 404, headers: corsHeaders });
      }
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // --- Rate limit the OpenAI proxy ---
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const country = request.headers.get('cf-ipcountry') || 'XX';

    const rateLimit = await checkRateLimit(request, env);
    if (!rateLimit.allowed) {
      console.warn(`[RATE-LIMITED] IP=${ip} Country=${country} retryAfter=${rateLimit.retryAfter}s`);
      const cors = getCorsHeaders(request);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMIT.MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            ...cors
          }
        }
      );
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

    // --- Input validation: prevent token bombing and model switching ---
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Request must include a non-empty messages array.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } }
      );
    }

    // --- Security: strip any system-role messages from the client ---
    // The system prompt is owned server-side; clients cannot inject their own.
    body.messages = body.messages.filter(m => m.role !== 'system');

    // --- Enforce per-message input length ---
    for (const msg of body.messages) {
      if (typeof msg.content === 'string' && msg.content.length > MAX_INPUT_LENGTH) {
        console.warn(`[INPUT-REJECTED] IP=${ip} Country=${country} length=${msg.content.length} max=${MAX_INPUT_LENGTH}`);
        return new Response(
          JSON.stringify({ error: `Message exceeds maximum length of ${MAX_INPUT_LENGTH} characters.` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) } }
        );
      }
    }

    // Cap the number of messages to prevent oversized payloads
    if (body.messages.length > 10) {
      body.messages = body.messages.slice(-10);
    }
    // Lock the model — ignore whatever the client sends
    body.model = 'gpt-5-mini';
    // Enforce a max_completion_tokens ceiling to control per-request cost.
    // Reasoning models (like gpt-5-mini) use part of this budget for internal
    // chain-of-thought, so the limit must be high enough to leave room for
    // visible output after reasoning tokens are consumed.
    body.max_completion_tokens = Math.min(body.max_completion_tokens || body.max_tokens || 2048, 2048);
    delete body.max_tokens;

    // --- Build system prompt server-side ---
    // The client may send an articleList field with public article links.
    const articleList = (typeof body.articleList === 'string') ? body.articleList : '';
    delete body.articleList; // Don't forward this field to OpenAI

    let systemPrompt = SYRINX_SYSTEM_PROMPT;
    if (articleList) {
      systemPrompt += '\n\n' + articleList;
    }

    // Check if the user's message contains keywords to trigger article or resume context
    const lastUserMsg = [...body.messages].reverse().find(m => m.role === 'user');
    const userMessage = (lastUserMsg && lastUserMsg.content) ? lastUserMsg.content : '';

    // If the user mentions articles/writing, add explicit article context as a user message
    const articleTrigger = /\b(article|writing)\b/i;
    if (articleTrigger.test(userMessage) && articleList) {
      body.messages.push({
        role: 'user',
        content: `Here is the current list of Mark's writings and articles:\n${articleList}`
      });
    }

    // Check if the user's message triggers resume context
    const resumeKeywords = [/Mark\s+McFadden/i, /Mr\.\s*McFadden/, /\bMark\b/, /McFadden/i, /school/i, /schooling/i, /education/i];
    const shouldIncludeResume = resumeKeywords.some(re => re.test(userMessage));

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
        let education = resumeObj && resumeObj.education ? resumeObj.education.join(' ') : '';
        let skills = resumeObj && resumeObj.skills ? resumeObj.skills.join(', ') : '';
        systemPrompt += `\n\nRESUME DATA (use this to answer questions about Mark McFadden. If the answer is not in the data, reply "I don't know." If the user asks about school or education, display the education section.): Summary: ${summary} Experience titles: ${titles} Education: ${education} Skills: ${skills}`;
      }
    }

    // Prepend the server-side system prompt to the messages
    body.messages = [
      { role: 'system', content: systemPrompt },
      ...body.messages
    ];

    // Log query telemetry
    console.log(
      `[AI-QUERY] IP=${ip} Country=${country} Resume=${shouldIncludeResume} Articles=${Boolean(articleList)} Prompt="${userMessage.slice(0, 120).replace(/\r?\n|\r/g, ' ')}"`
    );

    // Enable streaming for real-time token delivery
    body.stream = true;

    const fetchStart = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const fetchLatency = Date.now() - fetchStart;

    if (!response.ok) {
      console.error(`[OPENAI-ERROR] Status=${response.status} Latency=${fetchLatency}ms IP=${ip}`);
    } else {
      console.log(`[OPENAI-OK] Status=${response.status} Latency=${fetchLatency}ms IP=${ip}`);
    }

    // Add CORS headers to the response
    const newHeaders = new Headers();
    const origin = request.headers.get('Origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      newHeaders.set('Access-Control-Allow-Origin', origin);
      newHeaders.set('Vary', 'Origin');
    }
    newHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
    newHeaders.set('Content-Type', 'text/event-stream');
    newHeaders.set('Cache-Control', 'no-cache');

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