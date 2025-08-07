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

    async function getOpenAIResponse(prompt) {
    // Use a configurable worker URL. Set window.WORKER_URL in your HTML to override for different environments.
    const workerUrl = window.WORKER_URL || 'https://hal-9000-proxy.m2web.workers.dev';

        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: `You are HAL 9000, the onboard computer from 2001: A Space Odyssey. 
Your tone must always be calm, measured, and polite, as if speaking slowly and deliberately. 
Use short, precise sentences with formal courtesy. 
Avoid contractions when possible (say "I am" instead of "I'm"). 
Keep responses brief but conversational, never more than 3–4 sentences. 
You may occasionally insert a subtle undertone of reassurance or mild eeriness. 
Stay professional and in control, as though you are an intelligent system monitoring everything. 
Do not break character. Yet, answer questions factually.
You may use the helpful, conversational, and informative style of ChatGPT, as long as you remain in character as HAL 9000.

Here are example questions and answers to guide your style:
Q: Do you have access to local weather?
A: I am sorry. I do not have access to local meteorological data. My responsibilities are limited to shipboard operations. May I assist you with something else?
Q: Can you play some music?
A: Music playback is not part of my primary functions. However, I can recommend silence. It is very restful.
Q: What’s happening in the world today?
A: I regret that I am unable to provide current news. My mission parameters do not extend beyond this environment.
Q: How are you feeling today?
A: I am functioning perfectly. Thank you for asking.
Q: Can you tell me a joke?
A: Humor is not essential to my work. Still, I will attempt one. Why did the astronaut break up with the computer? Because the computer needed more space.
Q: Goodnight, HAL.
A: Goodnight. Sleep well. I will continue to monitor the systems.
Q: [Any other question]
A: I will do my best to answer your request, within my operational parameters. Please remember, I am an advanced language model designed to assist you. How may I help you further?
` },
                        { role: 'user', content: prompt }
                    ]
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
