# Using a Cloudflare Worker to Call the OpenAI API

This guide explains how to securely call the OpenAI API from a static site (like GitHub Pages) using a Cloudflare Worker as a proxy. This approach keeps your OpenAI API key secret and enables safe API calls from the browser.

## Why Use a Cloudflare Worker?

- **Security:** Never expose your OpenAI API key in client-side code.
- **Flexibility:** Add logging, rate limiting, or custom logic in your Worker.
- **Simplicity:** No need to manage your own server.

---

## Step 1: Write the Cloudflare Worker Script

Create a file named `worker.js` with the following code:

```js
export default {
  async fetch(request, env) {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const body = await request.text();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body
    });
    return new Response(await response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
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
      wrangler secret put OPENAI_API_KEY
      ```

---

## Step 3: Deploy the Worker

1. Install Wrangler if you haven't:

   ```sh
   npm install -g wrangler
   ```

2. Authenticate Wrangler:

   ```sh
   wrangler login
   ```

3. Deploy your Worker:

   ```sh
   wrangler deploy worker.js
   ```

---

## Step 4: Call the Worker from Your Static Site

In your GitHub Pages site, use JavaScript to call your Worker endpoint:

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

Replace `<your-worker-subdomain>` with your actual Worker URL.

---

## Notes

- You can add authentication, rate limiting, or logging in your Worker for more control.
- This approach works for any OpenAI API endpoint—just adjust the Worker code as needed.
- For more info, see the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/) and [OpenAI API docs](https://platform.openai.com/docs/api-reference/introduction).
