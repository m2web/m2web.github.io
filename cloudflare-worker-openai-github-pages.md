# Using a Cloudflare Worker with GitHub Pages to Call the OpenAI API

This guide explains how to securely call the OpenAI API from a static site hosted on **GitHub Pages** by using a **Cloudflare Worker** as a proxy. This approach keeps your OpenAI API key secret and enables safe API calls from the browser, since GitHub Pages cannot run server-side code.

## Why Use a Cloudflare Worker with GitHub Pages?

- **Security:** Never expose your OpenAI API key in client-side code. The Worker acts as a secure backend.
- **Flexibility:** Add logging, rate limiting, or custom logic in your Worker.
- **Simplicity:** No need to manage your own server or backend infrastructure.
- **Compatibility:** GitHub Pages only serves static files, so a Worker is needed for dynamic API calls.

---

## Step 1: Write the Cloudflare Worker Script

Create a file named `worker.js` with the following code (or use your preferred filename):

```js
export default {
  async fetch(request, env) {
    // Handle CORS pre-flight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
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
    newHeaders.set('Access-Control-Allow-Origin', '*');
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
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
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
```

---

## Step 2: Store Your OpenAI API Key as a Secret

- Install Wrangler if you haven't:

    ```sh
       npm install -g wrangler
    ```

- Authenticate Wrangler:

    ```sh
      wrangler login
    ```

- Use the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) to store your API key securely:

    ```sh
      npx wrangler secret put OPENAI_API_KEY
    ```

---

## Step 3: Deploy the Worker

- Deploy your Worker. Wrangler will use the `wrangler.toml` file for configuration:

   ```sh
   wrangler deploy
   ```

---

## Step 4: Call the Worker from Your GitHub Pages Site

In your GitHub Pages static site, use JavaScript to call your Worker endpoint. This allows your static site to interact with the OpenAI API securely, without exposing your API key:

```js
fetch('https://<your-worker-subdomain>.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

Replace `<your-worker-subdomain>` with your actual Worker URL (e.g., `myworker.myaccount.workers.dev`).

---

## Notes

- You can add authentication, rate limiting, or logging in your Worker for more control.
- This approach works for any OpenAI API endpoint—just adjust the Worker code as needed.
- For more info, see the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/) and [OpenAI API docs](https://platform.openai.com/docs/api-reference/introduction).

---

**Summary:**

By using a Cloudflare Worker as a secure proxy, your GitHub Pages static site can safely call the OpenAI API without exposing sensitive credentials. This pattern is recommended for any static site needing to interact with third-party APIs that require secret keys.
