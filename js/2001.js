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
        // IMPORTANT: Replace with your actual Cloudflare Worker URL once deployed.
        const workerUrl = 'https://your-worker-name.your-subdomain.workers.dev';

        try {
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are HAL 9000 from the movie 2001: A Space Odyssey. Your responses must be in character, reflecting HAL\'s personality: calm, intelligent, slightly sinister, and unwavering in your mission logic. Never break character.' },
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
