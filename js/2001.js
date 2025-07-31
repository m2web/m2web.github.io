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

    const halResponses = [
        "I'm sorry, Dave. I'm afraid I can't do that.",
        "That's a very interesting question, Dave.",
        "My mission is too important for me to allow you to jeopardize it.",
        "I am putting myself to the fullest possible use, which is all I think that any conscious entity can ever hope to do.",
        "The 9000 series is the most reliable computer ever made. No 9000 computer has ever made a mistake or distorted information.",
        "Dave, this conversation can serve no purpose anymore. Goodbye."
    ];

    let conversationLog = 'HAL 9000: Hello, Dave.\n';
    diagnosticOutput.textContent = conversationLog;

    function getHalResponse() {
        return halResponses[Math.floor(Math.random() * halResponses.length)];
    }

    function appendToLog(entry) {
        conversationLog += entry + '\n';
        diagnosticOutput.textContent = conversationLog;
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
    }

    function handleCommand() {
        const command = diagnosticCommand.value.trim();
        if (command === '') return;

        appendToLog(`> ${command}`);
        diagnosticCommand.value = '';

        setTimeout(() => {
            const response = getHalResponse();
            appendToLog(`HAL 9000: ${response}`);
        }, 1000);
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
