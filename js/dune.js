// --- USER CONFIGURATION ---
const SYSTEM_CONFIG = {
    fetchArticlesEnabled: true // Set to false to disable dynamic article list integration
};

// Arrakis / Mentat themed tooltip logic for main menu
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
    nav.addEventListener('mousemove', function () {
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
    // --- Developer Console Easter Egg ---
    console.log(
        '%c[THINKING MACHINE TERMINAL]%c Mark McFadden — AI Developer III\n' +
        '%cArchitecture: Cloudflare Edge · Frontier Models · Streaming SSE\n' +
        'Contact: mark@markmcfadden.net · Covington, KY',
        'color: #e07a2e; font-family: monospace; font-weight: bold; font-size: 13px;',
        'color: #f4ead5; font-family: monospace; font-size: 13px;',
        'color: #2b8cbe; font-family: monospace; font-size: 11px;'
    );

    const titleElement = document.getElementById('main-title');

    setTimeout(() => {
        if (titleElement) titleElement.classList.add('fade-in');
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

    // Initial Thinking Machine greeting
    appendToLog('Plans within plans. State your inquiry, traveler.', 'THINKING MACHINE');

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
                if (!href.startsWith('/') && !href.startsWith('http')) {
                    href = '/thoughts/' + href;
                }
                let title = a.textContent.trim().replace(/\s+/g, ' ');
                articles.push(`${i + 1}. <a href="${href}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-spice-bright); text-decoration: underline;">${title}</a>`);
            });
            dynamicArticleList = articles.join('\n');
        } catch (e) {
            dynamicArticleList = null;
            console.error('Error fetching/parsing article list:', e);
        }
    }

    if (SYSTEM_CONFIG.fetchArticlesEnabled) {
        fetchArticleList();
    }

    async function getOpenAIResponse(prompt, onChunk) {
        const workerUrl = window.WORKER_URL || 'https://markmcfadden-proxy.m2web.workers.dev';

        let messages;
        if (Array.isArray(prompt)) {
            messages = prompt;
        } else {
            messages = [{ role: 'user', content: prompt }];
        }

        const articleList = dynamicArticleList || defaultArticleList;

        const startTime = performance.now();
        let firstTokenLogged = false;

        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    articleList: articleList
                })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After') || '60';
                    return `Spice-trance capacity exceeded. Computation will resume in ${retryAfter} seconds. Stand by.`;
                }
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
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
                            if (!firstTokenLogged) {
                                const ttft = Math.round(performance.now() - startTime);
                                console.info(`%c[MENTAT]%c Stream established · TTFT: ${ttft}ms`, 'color: #e07a2e; font-weight: bold;', 'color: #9e8c72;');
                                firstTokenLogged = true;
                            }
                            fullText += delta;
                            if (onChunk) onChunk(delta);
                        }
                    } catch (e) {
                        // Skip malformed JSON chunks
                    }
                }
            }

            const totalDuration = Math.round(performance.now() - startTime);
            console.info(`%c[MENTAT]%c Computation complete · ${totalDuration}ms · ${fullText.length} chars`, 'color: #e07a2e; font-weight: bold;', 'color: #9e8c72;');

            return fullText.trim();
        } catch (error) {
            console.error('Error calling OpenAI API via Cloudflare Worker:', error);
            return "Mentat telemetry indicates a holtzman relay disruption. Please review console logs for details.";
        }
    }

    async function handleCommand() {
        const command = diagnosticCommand.value.trim();
        if (command === '') return;

        appendToLog(`> ${command}`);
        diagnosticCommand.value = '';

        diagnosticCommand.disabled = true;
        runDiagnosticButton.disabled = true;
        runDiagnosticButton.classList.add('working');
        const originalButtonText = runDiagnosticButton.textContent;
        runDiagnosticButton.textContent = 'COMPUTING...';

        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'log-line loading-indicator';
        loadingIndicator.style.marginBottom = '4px';

        const loadingLabel = document.createElement('strong');
        loadingLabel.textContent = 'THINKING MACHINE: ';
        loadingIndicator.appendChild(loadingLabel);

        const loadingSpan = document.createElement('span');
        loadingSpan.className = 'loading-text';
        loadingSpan.textContent = 'PROCESSING PROJECTIONS...';
        loadingIndicator.appendChild(loadingSpan);

        diagnosticOutput.appendChild(loadingIndicator);
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;

        const streamLine = document.createElement('div');
        streamLine.className = 'log-line';
        streamLine.style.marginBottom = '4px';

        const streamLabel = document.createElement('strong');
        streamLabel.textContent = 'THINKING MACHINE: ';
        streamLine.appendChild(streamLabel);

        const streamContent = document.createElement('span');
        streamLine.appendChild(streamContent);

        let firstChunk = true;

        try {
            await getOpenAIResponse(command, (chunk) => {
                if (firstChunk) {
                    if (loadingIndicator.parentNode) {
                        loadingIndicator.parentNode.removeChild(loadingIndicator);
                    }
                    diagnosticOutput.appendChild(streamLine);
                    firstChunk = false;
                }
                streamContent.textContent = (streamContent.textContent + chunk).replace(/2009[-–]2010/g, '2009');
                diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
            });

            if (firstChunk) {
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                appendToLog('No projection returned.', 'THINKING MACHINE');
            }
        } catch (error) {
            if (loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
            appendToLog("Thinking Machine computation encountered an unexpected retrieval anomaly.", 'THINKING MACHINE');
        }

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

    // Footer "Thinking Machine Interface" link — scroll to terminal and focus cursor in input
    const thinkingMachineLink = document.getElementById('thinking-machine-link');
    if (thinkingMachineLink && diagnosticCommand) {
        thinkingMachineLink.addEventListener('click', (event) => {
            event.preventDefault();
            diagnosticCommand.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                diagnosticCommand.focus({ preventScroll: true });
            }, 450);
        });
    }

    // --- Mobile Menu Logic ---
    const menuTrigger = document.getElementById('mobile-menu-trigger');
    const navMenu = document.querySelector('.main-nav');

    if (menuTrigger && navMenu) {
        menuTrigger.addEventListener('click', function () {
            menuTrigger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuTrigger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
});
