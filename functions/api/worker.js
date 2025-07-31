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