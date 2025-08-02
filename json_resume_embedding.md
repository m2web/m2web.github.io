# JSON Resume Embedding Approach

This guide explains how to enhance your Cloudflare Worker with a JSON-based resume embedding approach.  
It avoids Vectorize neuron limits and lets you provide structured context to an OpenAI LLM.

## Step 1 — Convert Resume to JSON

Break your resume into structured chunks. Example:

```json
{
  "experience": [
    "IT Lead at AAC Construction (2020–Present) – Managed Azure API Management, containerized workloads, and automation with Terraform.",
    "Microsoft Certified Trainer (2015–2020) – Specialized in Azure AI, DevOps, and cloud architecture."
  ],
  "skills": [
    "Azure, API Management, Terraform, Python, Cloudflare Workers, GitHub Actions"
  ],
  "education": [
    "B.S. in Computer Science, Northern Kentucky University"
  ],
  "projects": [
    "Developed AI-driven chatbot for client onboarding",
    "Built Hugo + Cloudflare Pages static site with OpenAI API integration"
  ]
}
```

## Step 2 — Upload Resume JSON to Cloudflare KV

Create a KV namespace:

```bash
npx wrangler kv namespace create RESUME
```

Bind it in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RESUME"
id = "your-kv-id"
```

Upload JSON:

```bash
npx wrangler kv:key put --binding=RESUME "resume" "$(cat resume.json)"
```

## Step 3 — Worker Logic

Fetch JSON from KV, flatten it into text, and pass it into the system prompt.

```js
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const userQ = url.searchParams.get("q") || "Tell me about Mark’s background";

    // 1. Get resume JSON
    const resumeJson = await env.RESUME.get("resume", { type: "json" });

    // 2. Flatten resume into text
    const resumeText = Object.entries(resumeJson)
      .map(([section, items]) => `${section.toUpperCase()}:\n${items.join("\n")}`)
      .join("\n\n");

    // 3. Build HAL system prompt
    const systemPrompt = `
You are HAL 9000. Answer calmly and concisely.
You may use the following resume data when relevant:

${resumeText}
    `;

    // 4. Send to OpenAI
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQ }
        ]
      })
    });

    const data = await res.json();
    return new Response(data.choices?.[0]?.message?.content || "I'm sorry, I can't answer that.");
  }
}
```

## Benefits

- No neuron limits (KV storage is free and generous).  
- Structured resume = easy to update without retraining.  
- Works well for a HAL-style assistant that remembers your background.
