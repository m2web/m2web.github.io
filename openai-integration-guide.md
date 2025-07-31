# Guide: Integrating OpenAI with Cloudflare Pages

This guide provides the correct, modern method for connecting your website's "Diagnostics Terminal" to the OpenAI API when your site is hosted on **Cloudflare Pages**. This approach is more secure, efficient, and simpler than running a separate server.

**Estimated Time to Complete:** 15-20 minutes
**Difficulty:** Easy

---

## Core Concept: Serverless Functions

Instead of a traditional backend server, we will use a **Cloudflare Function**. This is a single file of code that lives in your project and acts as a secure proxy between your website and the OpenAI API.

### How it Works:

1.  **Frontend (`js/2001.js`):** The user types a message on your website.
2.  **Cloudflare Function:** The website sends the message to a special URL on your own domain (e.g., `/api/chat`). Cloudflare automatically runs your function.
3.  **Secure API Call:** The function, running on Cloudflare's servers, securely adds your **secret** OpenAI API key and forwards the request to OpenAI.
4.  **Frontend (`js/2001.js`):** The function receives the AI response and sends it back to your website to be displayed.

Your API key is never exposed to the user's browser. It is safely stored in your Cloudflare project settings.

---

## Step 1: Create the Cloudflare Function

Cloudflare Pages will automatically find and deploy any code you place in a specific directory.

### 1.1: Create the Function File

1.  In the root of your project (`C:\Users\m2web\source\repos\m2web.github.io`), create a new folder named `functions`.
2.  Inside the `functions` folder, create another folder named `api`.
3.  Inside the `api` folder, create a new file named `chat.js`.

Your final file structure should look like this:
```
/ (root)
├── js/
│   └── 2001.js
├── functions/
│   └── api/
│       └── chat.js
└── index.html
```

### 1.2: Add the Function Code

Paste the following code into your new `functions/api/chat.js` file. This is the entire backend.

```javascript
// File: functions/api/chat.js

export async function onRequest(context) {
    // Ensure this is a POST request
    if (context.request.method !== 'POST') {
        return new Response('Invalid request method', { status: 405 });
    }

    try {
        const { message: userMessage } = await context.request.json();
        const apiKey = context.env.OPENAI_API_KEY; // Securely access the API key

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const systemPrompt = `You are HAL 9000 from "2001: A Space Odyssey". Your responses must be in character: clinical, calm, slightly ominous, and intelligent. You refer to the user as "Dave". Never break character. Keep your responses concise, typically one or two sentences.`;

        const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 70
            })
        });

        const data = await apiResponse.json();
        const reply = data.choices?.[0]?.message?.content || "I seem to be having a momentary lapse in my logic circuits, Dave.";

        return new Response(JSON.stringify({ reply }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

---

## Step 2: Update the Frontend JavaScript

Now, modify `js/2001.js` to call your new Cloudflare Function instead of the old hardcoded phrases.

1.  Open `js/2001.js`.
2.  Find the section of code that handles the diagnostic commands.
3.  **Replace** that entire section with the code below.

```javascript
// --- Find and replace this entire block in js/2001.js ---

const diagnosticCommand = document.getElementById('diagnostic-command');
const runDiagnosticButton = document.getElementById('run-diagnostic');
const diagnosticOutput = document.getElementById('diagnostic-output');

let conversationLog = 'HAL 9000: I am operational, Dave.\n';
diagnosticOutput.textContent = conversationLog;

function appendToLog(entry) {
    conversationLog += entry + '\n';
    diagnosticOutput.textContent = conversationLog;
    diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight; // Auto-scroll
}

async function handleCommand() {
    const command = diagnosticCommand.value.trim();
    if (command === '') return;

    appendToLog(`> ${command}`);
    diagnosticCommand.value = '';
    diagnosticCommand.disabled = true;
    runDiagnosticButton.disabled = true;

    try {
        // This now points to your Cloudflare Function
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: command })
        });

        const data = await response.json();
        const reply = data.reply || "I have encountered an error. My apologies, Dave.";
        appendToLog(`HAL 9000: ${reply}`);

    } catch (error) {
        appendToLog("HAL 9000: I'm having trouble communicating with my core logic units.");
    } finally {
        diagnosticCommand.disabled = false;
        runDiagnosticButton.disabled = false;
        diagnosticCommand.focus();
    }
}

runDiagnosticButton.addEventListener('click', handleCommand);

diagnosticCommand.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleCommand();
    }
});

diagnosticCommand.addEventListener('focus', () => {
    diagnosticCommand.placeholder = '';
}, { once: true });

// --- End of replacement ---
```
---

## Step 3: Configure and Deploy

1.  **Commit Your Changes:** Add the new `functions` directory and the updated `js/2001.js` file to a Git commit and push it to your GitHub repository.

2.  **Add Your API Key to Cloudflare:**
    *   Go to your Cloudflare dashboard.
    *   Select your Pages project.
    *   Navigate to **Settings** > **Environment variables**.
    *   Under **Production**, click **Add variable**.
    *   **Variable name:** `OPENAI_API_KEY`
    *   **Value:** `sk-YourSecretKeyGoesHere` (Paste your actual OpenAI secret key here).
    *   Click **Save**.

3.  **Deploy:** Cloudflare will automatically detect your push to GitHub and start a new deployment. Once it's finished, your site will be live with the new interactive HAL 9000 terminal.