# Cloudflare Worker Deployment Guide

This guide provides the steps to deploy the Cloudflare Worker that acts as a secure proxy to the OpenAI API.

## Prerequisites

Before you begin, ensure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.

## Step 1: Install the Cloudflare Wrangler CLI

The Wrangler CLI is the official tool for managing and deploying Cloudflare Workers. Install it globally by running this command in your terminal:

```sh
npm install -g wrangler
```

## Step 2: Authenticate with Cloudflare

Next, log in to your Cloudflare account. This command will open a browser window for you to authorize Wrangler.

```sh
wrangler login
```

## Step 3: Set Your OpenAI API Key

To keep your API key secure, we'll store it as a secret that only your Worker can access. Run the following command and paste your OpenAI API key when prompted.

**Important:** This command must be run from the root directory of the project (`C:\Users\m2web\source\repos\m2web.github.io`).

```sh
wrangler secret put OPENAI_API_KEY
```

## Step 4: Deploy the Worker

Now, deploy the Worker script located at `functions/api/worker.js`. This command will bundle and upload your script to the Cloudflare network.

**Important:** This command must also be run from the root directory.

```sh
wrangler deploy functions/api/worker.js --name your-worker-name
```

- Replace `your-worker-name` with a unique name for your worker (e.g., `hal-9000-proxy`).
- After deployment, Wrangler will output your worker's public URL, which will look something like `https://your-worker-name.your-subdomain.workers.dev`.

## Step 5: Update the JavaScript with Your Worker URL

Finally, you need to tell the website how to contact your newly deployed worker.

1. Copy the worker URL from the output of the `wrangler deploy` command.
2. Open the `js/2001.js` file.
3. Find the following line of code:

    ```javascript
    const workerUrl = 'https://your-worker-name.your-subdomain.workers.dev';
    ```

4. Replace the placeholder URL with your actual worker URL.

Once you have completed these steps, the diagnostics chat on your website will be fully functional, powered by the OpenAI API via your secure Cloudflare Worker.
