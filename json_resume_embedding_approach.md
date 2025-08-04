# JSON Resume Embedding Approach

This guide explains how to enhance your Cloudflare Worker with a JSON-based resume embedding approach.  
It avoids Vectorize neuron limits and lets you provide structured context to an OpenAI LLM.

## Step 1 — Convert Resume to JSON

You’ll first need to convert your resume (e.g., Word `.docx`) into structured JSON. This will let you provide clean, sectioned data to the LLM.

### Extracting from Word

1. **Save your resume** as a `.docx` file.
2. **Parse it into JSON** using Python:

```python
from docx import Document
import json

doc = Document("resume.docx")

experience, skills, education, projects = [], [], [], []
current_section = None

for para in doc.paragraphs:
    text = para.text.strip()
    if not text:
        continue
    if text.lower().startswith("experience"):
        current_section = experience
        continue
    elif text.lower().startswith("skills"):
        current_section = skills
        continue
    elif text.lower().startswith("education"):
        current_section = education
        continue
    elif text.lower().startswith("projects"):
        current_section = projects
        continue
    if current_section is not None:
        current_section.append(text)

resume_json = {
    "experience": experience,
    "skills": skills,
    "education": education,
    "projects": projects
}

with open("resume.json", "w") as f:
    json.dump(resume_json, f, indent=2)
```

3. **Verify the output** by opening `resume.json`. Each section should be an array of strings. Adjust the section headers in the script if your resume uses different labels (e.g., *Work History* instead of *Experience*).

### Example JSON Output

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
