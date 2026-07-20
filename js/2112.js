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

    async function getOpenAIResponse(prompt, onChunk) {
        // Use a configurable worker URL. Set window.WORKER_URL in your HTML to override for different environments.
        const workerUrl = window.WORKER_URL || 'https://markmcfadden-proxy.m2web.workers.dev';

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
        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-5-mini',
                    messages: messages,
                    stream: true
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            // Read the SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                // Keep the last potentially incomplete line in the buffer
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data:')) continue;
                    const data = trimmed.slice(5).trim();
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                            fullText += delta;
                            if (onChunk) onChunk(delta);
                        }
                    } catch (e) {
                        // Skip malformed JSON chunks
                    }
                }
            }

            return fullText.trim();
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
        runDiagnosticButton.classList.add('working');
        const originalButtonText = runDiagnosticButton.textContent;
        runDiagnosticButton.textContent = 'PROCESSING...';

        // Add visual loading indicator in output console
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'log-line loading-indicator';
        loadingIndicator.style.marginBottom = '4px';

        const loadingLabel = document.createElement('strong');
        loadingLabel.textContent = 'SYRINX SYSTEM: ';
        loadingIndicator.appendChild(loadingLabel);

        const loadingSpan = document.createElement('span');
        loadingSpan.className = 'loading-text';
        loadingSpan.textContent = 'ANALYZING INPUT...';
        loadingIndicator.appendChild(loadingSpan);

        diagnosticOutput.appendChild(loadingIndicator);
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;

        // Prepare a DOM line for streamed response
        const streamLine = document.createElement('div');
        streamLine.className = 'log-line';
        streamLine.style.marginBottom = '4px';

        const streamLabel = document.createElement('strong');
        streamLabel.textContent = 'SYRINX SYSTEM: ';
        streamLine.appendChild(streamLabel);

        const streamContent = document.createElement('span');
        streamLine.appendChild(streamContent);

        let firstChunk = true;

        try {
            await getOpenAIResponse(command, (chunk) => {
                // On first token, swap loading indicator for the stream line
                if (firstChunk) {
                    if (loadingIndicator.parentNode) {
                        loadingIndicator.parentNode.removeChild(loadingIndicator);
                    }
                    diagnosticOutput.appendChild(streamLine);
                    firstChunk = false;
                }
                streamContent.textContent += chunk;
                diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
            });

            // If we never got a chunk (empty response), still clean up the loader
            if (firstChunk) {
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                appendToLog('No response received.', 'SYRINX SYSTEM');
            }
        } catch (error) {
            if (loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
            appendToLog("System diagnostics indicate an unexpected retrieval error.", 'SYRINX SYSTEM');
        }

        // Re-enable input and restore button state
        runDiagnosticButton.classList.remove('working');
        runDiagnosticButton.textContent = originalButtonText;
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

    // --- Mobile Menu Logic ---
    const menuTrigger = document.getElementById('mobile-menu-trigger');
    const navMenu = document.querySelector('.main-nav');
    
    if (menuTrigger && navMenu) {
        menuTrigger.addEventListener('click', function() {
            menuTrigger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuTrigger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
});
