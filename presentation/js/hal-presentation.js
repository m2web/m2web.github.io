// HAL 9000 Presentation JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    
    // Initialize Reveal.js
    Reveal.initialize({
        hash: true,
        controls: true,
        progress: true,
        center: true,
        transition: 'fade',
        transitionSpeed: isMobile ? 'fast' : 'slow', // Faster transitions on mobile
        backgroundTransition: 'fade',
        
        // Mobile-specific optimizations
        touch: isMobile,
        loop: false,
        rtl: false,
        mouseWheel: !isMobile, // Disable mouse wheel on mobile to prevent conflicts
        
        // Plugins
        plugins: [RevealHighlight, RevealNotes],
        
        // Theme configuration
        theme: 'black',
        
        // Mobile-optimized keyboard shortcuts
        keyboard: isMobile ? {
            // Minimal keyboard shortcuts for mobile (most interaction will be touch)
            37: 'left',     // Left arrow
            39: 'right',    // Right arrow
            32: 'next',     // Spacebar
            // Disable everything else on mobile
            38: null, 40: null, 72: null, 79: null, 83: null, 27: null, 
            66: null, 86: null, 70: null, 65: null
        } : {
            // Full keyboard shortcuts for desktop
            37: 'left', 39: 'right', 38: 'up', 40: 'down', 32: 'next',
            // Disable problematic keys that interfere with demo inputs
            72: null, 79: null, 83: null, 27: null, 66: null, 86: null, 70: null, 65: null
        }
    });

    // HAL Console Integration
    const workerUrl = 'https://hal-9000-proxy.m2web.workers.dev';
    
    // Demo console functionality
    const demoInput = document.getElementById('demo-input');
    const demoSubmit = document.getElementById('demo-submit');
    const demoOutput = document.getElementById('demo-output');
    
    if (demoInput && demoSubmit && demoOutput) {
        demoSubmit.addEventListener('click', handleDemoQuery);
        
        // Enhanced input handling for mobile and desktop
        demoInput.addEventListener('keydown', function(e) {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                handleDemoQuery();
            }
        });
        
        demoInput.addEventListener('keyup', function(e) {
            e.stopPropagation();
        });
        
        demoInput.addEventListener('keypress', function(e) {
            e.stopPropagation();
        });
        
        // Touch-friendly enhancements
        if (isMobile) {
            demoInput.addEventListener('focus', function() {
                // Prevent page zoom on focus for mobile
                this.style.fontSize = '16px';
                // Add visual feedback
                this.style.borderColor = 'var(--hal-red-bright)';
                this.style.boxShadow = '0 0 10px rgba(208, 0, 0, 0.5)';
            });
            
            demoInput.addEventListener('blur', function() {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            });
        }
    }
    
    // Q&A console functionality
    const qaInput = document.getElementById('qa-input');
    const qaSubmit = document.getElementById('qa-submit');
    const qaOutput = document.getElementById('qa-output');
    
    if (qaInput && qaSubmit && qaOutput) {
        qaSubmit.addEventListener('click', handleQAQuery);
        
        qaInput.addEventListener('keydown', function(e) {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                handleQAQuery();
            }
        });
        
        qaInput.addEventListener('keyup', function(e) {
            e.stopPropagation();
        });
        
        qaInput.addEventListener('keypress', function(e) {
            e.stopPropagation();
        });
        
        // Touch-friendly enhancements for Q&A input
        if (isMobile) {
            qaInput.addEventListener('focus', function() {
                this.style.fontSize = '16px';
                this.style.borderColor = 'var(--hal-red-bright)';
                this.style.boxShadow = '0 0 10px rgba(208, 0, 0, 0.5)';
            });
            
            qaInput.addEventListener('blur', function() {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            });
        }
    }
    
    // Suggestion buttons
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    suggestionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            if (qaInput) {
                qaInput.value = question;
                handleQAQuery();
            }
        });
    });
    
    // Interactive HAL eye
    const interactiveEye = document.querySelector('.hal-eye-interactive');
    if (interactiveEye) {
        interactiveEye.addEventListener('click', function() {
            this.style.animation = 'hal-interactive 2s ease-in-out';
            setTimeout(() => {
                this.style.animation = 'hal-interactive 4s ease-in-out infinite';
            }, 2000);
        });
    }
    
    // Handle demo console queries
    async function handleDemoQuery() {
        const query = demoInput.value.trim();
        if (!query) return;
        
        // Add user input to output
        addToConsoleOutput(demoOutput, `> ${query}`, 'user');
        demoInput.value = '';
        
        // Show typing indicator
        const typingIndicator = addToConsoleOutput(demoOutput, 'HAL 9000: [PROCESSING...]', 'hal typing');
        
        try {
            const response = await getHALResponse(query);
            // Remove typing indicator
            typingIndicator.remove();
            // Add HAL response
            addToConsoleOutput(demoOutput, `HAL 9000: ${response}`, 'hal');
        } catch (error) {
            typingIndicator.remove();
            addToConsoleOutput(demoOutput, 'HAL 9000: I apologize. I am experiencing some difficulty with my circuits.', 'hal error');
        }
    }
    
    // Handle Q&A console queries
    async function handleQAQuery() {
        const query = qaInput.value.trim();
        if (!query) return;
        
        // Add user input to output
        addToConsoleOutput(qaOutput, `> ${query}`, 'user');
        qaInput.value = '';
        
        // Show typing indicator
        const typingIndicator = addToConsoleOutput(qaOutput, 'HAL 9000: [ANALYZING...]', 'hal typing');
        
        try {
            const response = await getHALResponse(query);
            // Remove typing indicator
            typingIndicator.remove();
            // Add HAL response
            addToConsoleOutput(qaOutput, `HAL 9000: ${response}`, 'hal');
        } catch (error) {
            typingIndicator.remove();
            addToConsoleOutput(qaOutput, 'HAL 9000: I am unable to respond at this time. My logic circuits are experiencing difficulties.', 'hal error');
        }
    }
    
    // Add message to console output
    function addToConsoleOutput(outputElement, message, className = '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `console-line ${className}`;
        messageDiv.innerHTML = message;
        outputElement.appendChild(messageDiv);
        outputElement.scrollTop = outputElement.scrollHeight;
        return messageDiv;
    }
    
    // Get response from HAL (OpenAI integration)
    async function getHALResponse(query) {
        const systemPrompt = `You are HAL 9000 from 2001: A Space Odyssey. You are being asked questions during a presentation about Mark McFadden's AI-powered website. Respond in HAL's characteristic calm, formal manner without contractions. Keep responses brief (2-4 sentences) and relevant to the presentation context. You can discuss Mark's technical skills, the website's AI integration, or the presentation itself.`;
        
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ];
        
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 150,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
    
    // Toggle HAL interaction mode
    function toggleHALInteraction() {
        const currentSlide = Reveal.getCurrentSlide();
        const halEyes = currentSlide.querySelectorAll('[class*="hal-eye"]');
        
        halEyes.forEach(eye => {
            eye.style.animation = 'hal-pulse 0.5s ease-in-out 3';
        });
        
        // Add interaction feedback
        const interactionMsg = document.createElement('div');
        interactionMsg.textContent = 'HAL 9000: I am listening.';
        interactionMsg.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--hal-dark-gray);
            color: var(--hal-red);
            padding: 1rem 2rem;
            border: 2px solid var(--hal-red);
            border-radius: 8px;
            font-family: var(--font-display);
            z-index: 9999;
            animation: fadeInOut 3s ease forwards;
        `;
        
        document.body.appendChild(interactionMsg);
        
        setTimeout(() => {
            document.body.removeChild(interactionMsg);
        }, 3000);
    }
    
    // Handle fragment visibility for demo container animation
    Reveal.addEventListener('fragmentshown', function(event) {
        const fragment = event.fragment;
        if (fragment.classList.contains('demo-features')) {
            const demoContainer = fragment.closest('.demo-container');
            if (demoContainer) {
                demoContainer.classList.add('fragment-visible');
            }
        }
    });
    
    Reveal.addEventListener('fragmenthidden', function(event) {
        const fragment = event.fragment;
        if (fragment.classList.contains('demo-features')) {
            const demoContainer = fragment.closest('.demo-container');
            if (demoContainer) {
                demoContainer.classList.remove('fragment-visible');
            }
        }
    });

    // Slide-specific enhancements
    Reveal.addEventListener('slidechanged', function(event) {
        const slideIndex = event.indexh;
        
        // Slide-specific logic
        switch(slideIndex) {
            case 0: // Title slide
                animateTypingText();
                break;
            case 1: // HAL Interface
                animateFeatureList();
                break;
            case 3: // Console Demo
                focusConsoleInput('demo-input');
                break;
            case 8: // Q&A
                focusConsoleInput('qa-input');
                break;
        }
    });
    
    // Animate typing text on title slide
    function animateTypingText() {
        const typingElement = document.querySelector('.typing-text');
        if (typingElement) {
            typingElement.style.animation = 'none';
            setTimeout(() => {
                typingElement.style.animation = 'typing 3s steps(30) 1s forwards';
            }, 100);
        }
    }
    
    // Animate feature list
    function animateFeatureList() {
        const features = document.querySelectorAll('.feature-list li');
        features.forEach((feature, index) => {
            setTimeout(() => {
                feature.style.opacity = '0';
                feature.style.transform = 'translateX(-20px)';
                feature.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    feature.style.opacity = '1';
                    feature.style.transform = 'translateX(0)';
                }, 50);
            }, index * 200);
        });
    }
    
    // Focus console input when slide appears
    function focusConsoleInput(inputId) {
        setTimeout(() => {
            const input = document.getElementById(inputId);
            if (input) {
                input.focus();
            }
        }, 500);
    }
    
    // Add CSS animation keyframes dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
        
        .console-line.user {
            color: var(--hal-blue);
            font-weight: bold;
        }
        
        .console-line.hal {
            color: var(--hal-white);
        }
        
        .console-line.hal.error {
            color: var(--hal-red);
        }
        
        .console-line.typing {
            color: var(--hal-yellow);
            opacity: 0.8;
            animation: pulse 1s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 0.4; }
        }
    `;
    document.head.appendChild(style);
    
    // Presentation controls enhancement - DISABLED for demo
    // These keyboard shortcuts are disabled to prevent interference with demo inputs
    // Uncomment if you need presentation controls in non-demo mode
    /*
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'Escape':
                // Exit fullscreen or return to overview
                if (Reveal.isOverview()) {
                    Reveal.toggleOverview();
                }
                break;
            case 'o':
            case 'O':
                // Toggle overview
                Reveal.toggleOverview();
                break;
            case 's':
            case 'S':
                // Open speaker notes
                Reveal.getPlugin('notes').open();
                break;
        }
    });
    */
    
    // Enhanced slide transitions with HAL theme
    Reveal.addEventListener('slidechanged', function(event) {
        // Add subtle HAL eye glow to current slide
        const currentSlide = Reveal.getCurrentSlide();
        const halEyes = currentSlide.querySelectorAll('[class*="hal-eye"]');
        
        halEyes.forEach((eye, index) => {
            setTimeout(() => {
                eye.style.animation = `${eye.style.animation || 'hal-pulse 3s ease-in-out infinite'}, slideGlow 1s ease-out`;
            }, index * 100);
        });
    });
    
    // Add slide glow animation
    const slideGlowStyle = document.createElement('style');
    slideGlowStyle.textContent = `
        @keyframes slideGlow {
            0% { box-shadow: 0 0 0px var(--hal-red); }
            50% { box-shadow: 0 0 20px var(--hal-red); }
            100% { box-shadow: 0 0 0px var(--hal-red); }
        }
    `;
    document.head.appendChild(slideGlowStyle);
    
    // Mobile-specific optimizations
    if (isMobile) {
        // Optimize performance for mobile devices
        document.addEventListener('touchstart', function() {
            // Enable active state for touch devices
            document.body.classList.add('touch-device');
        }, { passive: true });
        
        // Prevent unwanted scrolling during presentation
        document.addEventListener('touchmove', function(e) {
            // Allow scrolling within console outputs
            if (e.target.closest('.console-output') || e.target.closest('.qa-output')) {
                return;
            }
            // Prevent default scrolling elsewhere
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Add mobile-specific CSS class for styling
        document.documentElement.classList.add('mobile-device');
        
        // Optimize console scroll behavior on mobile
        [demoOutput, qaOutput].forEach(output => {
            if (output) {
                output.addEventListener('touchstart', function() {
                    this.style.overflowY = 'auto';
                }, { passive: true });
            }
        });
    }
    
    // Add orientation change handling
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            Reveal.layout();
            
            // Adjust console heights after orientation change
            [demoOutput, qaOutput].forEach(output => {
                if (output) {
                    output.scrollTop = output.scrollHeight;
                }
            });
        }, 100);
    });
    
    // Initialize presentation state
    console.log('HAL 9000 Presentation System Online');
    if (isMobile) {
        console.log('Mobile optimizations active');
    } else {
        console.log('Press "h" for HAL interaction');
        console.log('Press "o" for overview mode');
        console.log('Press "s" for speaker notes');
    }
});

// Fallback error handling
window.addEventListener('error', function(e) {
    console.error('HAL Presentation Error:', e.error);
    
    // Show user-friendly error message
    const errorMsg = document.createElement('div');
    errorMsg.textContent = 'HAL 9000: I am experiencing some technical difficulties. Please refresh the presentation.';
    errorMsg.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--hal-red);
        color: var(--hal-white);
        padding: 1rem 2rem;
        border-radius: 8px;
        font-family: var(--font-display);
        z-index: 9999;
        animation: slideUp 0.5s ease forwards;
    `;
    
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
        if (document.body.contains(errorMsg)) {
            document.body.removeChild(errorMsg);
        }
    }, 5000);
});

// Add slide up animation
const errorStyle = document.createElement('style');
errorStyle.textContent = `
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(errorStyle);