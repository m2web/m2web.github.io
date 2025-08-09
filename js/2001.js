// HAL 9000 themed tooltip logic for main menu
(function() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    let tooltip = document.createElement('div');
    tooltip.className = 'hal-tooltip';
    document.body.appendChild(tooltip);
    let active = null;

    nav.addEventListener('mouseover', function(e) {
        const link = e.target.closest('a[data-tooltip]');
        if (link) {
            tooltip.textContent = link.getAttribute('data-tooltip');
            tooltip.classList.add('visible');
            active = link;
            const rect = link.getBoundingClientRect();
            // Position tooltip above or below depending on space
            let top = rect.top - tooltip.offsetHeight - 8;
            if (top < 0) top = rect.bottom + 8;
            let left = rect.left + (rect.width - tooltip.offsetWidth) / 2;
            if (left < 8) left = 8;
            if (left + tooltip.offsetWidth > window.innerWidth - 8) left = window.innerWidth - tooltip.offsetWidth - 8;
            tooltip.style.top = top + window.scrollY + 'px';
            tooltip.style.left = left + window.scrollX + 'px';
        }
    });
    nav.addEventListener('mouseout', function(e) {
        const link = e.target.closest('a[data-tooltip]');
        if (link && link === active) {
            tooltip.classList.remove('visible');
            active = null;
        }
    });
    nav.addEventListener('mousemove', function(e) {
        if (active) {
            const rect = active.getBoundingClientRect();
            let top = rect.top - tooltip.offsetHeight - 8;
            if (top < 0) top = rect.bottom + 8;
            let left = rect.left + (rect.width - tooltip.offsetWidth) / 2;
            if (left < 8) left = 8;
            if (left + tooltip.offsetWidth > window.innerWidth - 8) left = window.innerWidth - tooltip.offsetWidth - 8;
            tooltip.style.top = top + window.scrollY + 'px';
            tooltip.style.left = left + window.scrollX + 'px';
        }
    });
})();
document.addEventListener('DOMContentLoaded', function() {
    const titleElement = document.getElementById('main-title');
    const titleText = 'M A R K   M C F A D D E N'; // Reduced spaces
    let i = 0;
    let currentTypedText = ''; // To build the string

    function typeWriter() {
        if (i < titleText.length) {
            currentTypedText += titleText.charAt(i);
            titleElement.innerHTML = currentTypedText; // Update innerHTML once
            i++;
            setTimeout(typeWriter, 150);
        }
    }

    typeWriter();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    const sections = document.querySelectorAll('.monolith');
    sections.forEach(section => {
        observer.observe(section);
    });

    const diagnosticCommand = document.getElementById('diagnostic-command');
    const runDiagnosticButton = document.getElementById('run-diagnostic');
    const diagnosticOutput = document.getElementById('diagnostic-output');

    let conversationLog = 'HAL 9000: Hello, Dave.\n';
    diagnosticOutput.textContent = conversationLog;

    function appendToLog(entry) {
        conversationLog += entry + '\n';
        diagnosticOutput.textContent = conversationLog;
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
    }

    // --- Dynamic Article List Integration ---
    let dynamicArticleList = null;
    const defaultArticleList = `1. WaPo // (Imaginary) MESSAGE CONSOLE: A Conversation with a subservient AI? (WalPo-AI-Conversation.html)
2. Alex Lifeson’s New Sonic Frontier: The Bold Brilliance ofEnvy of None (alex-lifeson-envy-of-none.html)
3. Trump’s Minimalist Message: Irony and Insult (irony-and-insult.html)
4. Using Tariff Revenues to Support the Working Class (tarrif-dividend.html)
5. RIP Globalism: 1945-2024 (RIP_Globalism_1945-2024.html)
6. The New US Foreign Policy: Hawkish Isolationism (hawkish-isolationism.html)
7. Syncretism in the American Evangelical Church (american-syncretism.html)`;

    async function fetchArticleList() {
        try {
            const res = await fetch('/thoughts/index.html');
            if (!res.ok) throw new Error('Failed to fetch thoughts index');
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('.hal-subscr ul li a');
            let articles = [];
            links.forEach((a, i) => {
                const href = a.getAttribute('href');
                let title = a.textContent.trim().replace(/\s+/g, ' ');
                articles.push(`${i+1}. ${title} (${href})`);
            });
            dynamicArticleList = articles.join('\n');
        } catch (e) {
            dynamicArticleList = null;
            console.error('Error fetching/parsing article list:', e);
        }
    }
    // Fetch on page load
    fetchArticleList();

    async function getOpenAIResponse(prompt) {
        // Use a configurable worker URL. Set window.WORKER_URL in your HTML to override for different environments.
        const workerUrl = window.WORKER_URL || 'https://hal-9000-proxy.m2web.workers.dev';

        // No need to append article list to the user prompt; only the system prompt will contain the list
        // Accepts either a string (single prompt) or an array of messages (conversation history)
        // If a string is passed, wrap it as a single user message
        let messages;
        if (Array.isArray(prompt)) {
            messages = prompt;
        } else {
            // Use dynamic list if available, else fallback
            const articleList = dynamicArticleList || defaultArticleList;
            const triggerRegex = /\b(article|writing)\b/i;
            const systemPrompt = `You are HAL 9000 from 2001: A Space Odyssey. Speak calmly, formally, and without contractions. Remain polite, brief (max 7-12 sentences), and in character as a shipboard AI near Jupiter, but able to access Earth data. Answer factually, with a subtle undertone of reassurance or mild eeriness. Never break character.

If the user asks about education, school, schooling, writing, or articles, reference or summarize the related essays and articles listed below.

You have access to the following essays and articles (full text available in the workspace). Reference or summarize these if asked:

${articleList}`;
            if (triggerRegex.test(prompt)) {
                messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                    { role: 'user', content: `Here is the current list of Mark's writings and articles: \n${articleList}` }
                ];
            } else {
                messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ];
            }
        }
        // Debug: log the prompt being sent to OpenAI
        console.log('OpenAI API messages:', messages);
        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error calling OpenAI API via Cloudflare Worker:', error);
            return "I'm sorry, Dave. I'm afraid I'm having some trouble with my circuits right now. Please check the console for more information.";
        }
    }

    async function handleCommand() {
        const command = diagnosticCommand.value.trim();
        if (command === '') return;

        appendToLog(`> ${command}`);
        diagnosticCommand.value = '';

        // Disable input while waiting for response
        diagnosticCommand.disabled = true;
        runDiagnosticButton.disabled = true;

        const response = await getOpenAIResponse(command);
        appendToLog(`HAL 9000: ${response}`);

        // Re-enable input
        diagnosticCommand.disabled = false;
        runDiagnosticButton.disabled = false;
        diagnosticCommand.focus();
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
});
