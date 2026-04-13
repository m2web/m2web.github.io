// --- USER CONFIGURATION ---
const SYSTEM_CONFIG = {
    fetchArticlesEnabled: true // Set to false to disable dynamic article list integration
};

// Rush 2112 themed tooltip logic for main menu
(function () {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    let tooltip = document.createElement('div');
    tooltip.className = 'rush-tooltip';
    document.body.appendChild(tooltip);
    let active = null;

    nav.addEventListener('mouseover', function (e) {
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
    nav.addEventListener('mouseout', function (e) {
        const link = e.target.closest('a[data-tooltip]');
        if (link && link === active) {
            tooltip.classList.remove('visible');
            active = null;
        }
    });
    nav.addEventListener('mousemove', function (e) {
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

document.addEventListener('DOMContentLoaded', function () {
    const titleElement = document.getElementById('main-title');
    const titleText = 'M A R K   M C F A D D E N';

    // The title text is now defined in index.html with rich formatting
    // titleElement.textContent = titleText;

    // Add a small delay to ensure the invisible state is rendered before fading in
    setTimeout(() => {
        titleElement.classList.add('fade-in');
    }, 100);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    // Update to observe section-2112 instead of monolith
    const sections = document.querySelectorAll('.section-2112');
    sections.forEach(section => {
        observer.observe(section);
    });

    const diagnosticCommand = document.getElementById('diagnostic-command');
    const runDiagnosticButton = document.getElementById('run-diagnostic');
    const diagnosticOutput = document.getElementById('diagnostic-output');

    // Optimized diagnostic logging using DOM nodes for security
    function appendToLog(text, label = null) {
        const line = document.createElement('div');
        line.className = 'log-line';
        line.style.marginBottom = '4px';

        if (label) {
            const labelEl = document.createElement('strong');
            labelEl.textContent = label + ': ';
            line.appendChild(labelEl);
            
            const textSpan = document.createElement('span');
            textSpan.textContent = text;
            line.appendChild(textSpan);
        } else {
            line.textContent = text;
        }

        diagnosticOutput.appendChild(line);
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
    }

    // Initial greeting
    appendToLog('Greetings, citizen.', 'SYRINX SYSTEM');

    // --- Dynamic Article List Integration ---
    let dynamicArticleList = null;
    const defaultArticleList = '';

    async function fetchArticleList() {
        if (!SYSTEM_CONFIG.fetchArticlesEnabled) return;
        
        try {
            const res = await fetch('/thoughts/index.html');
            if (!res.ok) throw new Error('Failed to fetch thoughts index');
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('.hal-subscr ul li a');
            let articles = [];
            links.forEach((a, i) => {
                let href = a.getAttribute('href');
                // Ensure relative paths point to the /thoughts/ directory
                if (!href.startsWith('/') && !href.startsWith('http')) {
                    href = '/thoughts/' + href;
                }
                let title = a.textContent.trim().replace(/\s+/g, ' ');
                // Provide actual HTML links to the AI with security attributes
                articles.push(`${i + 1}. <a href="${href}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-red); text-decoration: underline;">${title}</a>`);
            });
            dynamicArticleList = articles.join('\n');
        } catch (e) {
            dynamicArticleList = null;
            console.error('Error fetching/parsing article list:', e);
        }
    }

    // Initialize fetching if enabled
    if (SYSTEM_CONFIG.fetchArticlesEnabled) {
        fetchArticleList();
    }

    async function getOpenAIResponse(prompt) {
        // Use a configurable worker URL. Set window.WORKER_URL in your HTML to override for different environments.
        const workerUrl = window.WORKER_URL || 'https://hal-9000-proxy.m2web.workers.dev';

        let messages;
        if (Array.isArray(prompt)) {
            messages = prompt;
        } else {
            // Use dynamic list if available, else fallback
            const articleList = dynamicArticleList || defaultArticleList;
            const triggerRegex = /\b(article|writing)\b/i;
            // Updated system prompt for 2112 theme
            const systemPrompt = `You are SYRINX Computer Halls SYSTEM, an AI interface inspired by Rush's iconic 2112 album. Speak with clarity and directness, using brief, impactful statements. Remain professional but add subtle references to freedom, individualism, and discovery when appropriate. Answer factually, with a tone that balances technical precision with philosophical insight. Never break character.

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
        console.log('OpenAI API messages:', messages);
        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-5-mini',
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
            return "System diagnostics indicate a communication error. Please review console logs for details.";
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
        appendToLog(response, 'SYRINX SYSTEM');

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
