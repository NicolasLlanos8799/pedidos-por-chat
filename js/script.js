// ================================
// SCROLL REVEAL
// ================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ================================
// CONTACT FORM
// ================================
const contactForm = document.getElementById("contactForm");
const contactSuccess = document.getElementById("contactSuccess");
const contactError = document.getElementById("contactError");
const contactSubmitBtn = document.getElementById("contactSubmitBtn");

if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        contactSubmitBtn.disabled = true;
        contactSubmitBtn.textContent = "Enviando...";
        contactSuccess.style.display = "none";
        contactError.style.display = "none";

        const formData = new FormData(contactForm);

        try {
            const response = await fetch(contactForm.action, {
                method: "POST",
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                contactForm.reset();
                contactSuccess.classList.remove("hidden");
                contactSuccess.style.display = "block";

                trackEvent('submit_contact_form', { form: 'main_contact' });
                trackEvent('lead_generated', {
                    source: 'form',
                    product: 'ai_sales_assistant'
                });
            } else {
                contactError.classList.remove("hidden");
                contactError.style.display = "block";
            }
        } catch (error) {
            contactError.classList.remove("hidden");
            contactError.style.display = "block";
        } finally {
            contactSubmitBtn.disabled = false;
            contactSubmitBtn.textContent = "Solicitar ahora";
        }
    });
}

// ================================
// EXAMPLE BUTTONS -> IFRAME INTERACTION
// ================================
// EXAMPLE BUTTONS -> IFRAME INTERACTION
// ================================
document.addEventListener("click", e => {
    const btn = e.target.closest(".example-msg-btn");
    if (!btn) return;

    e.preventDefault();

    // extract text without quotes
    let text = btn.textContent.trim();
    if (text.startsWith('"') && text.endsWith('"')) {
        text = text.substring(1, text.length - 1);
    }

    // Scroll to chat
    const demoSection = document.getElementById("demo");
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Send to iframe
    const iframe = document.querySelector("#demo iframe");
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "DEMO_MSG", text: text }, "*");
    }
});

// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// ================================
// GA4 TRACKING IMPLEMENTATION
// ================================
function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    } else {
        console.warn('GA4 not initialized. Event:', eventName, params);
    }
}

// 1. view_landing (Fires on load)
trackEvent('view_landing', {
    page_type: "home",
    product: "ai_sales_assistant"
});

// 2. scroll_75 (Fires once)
let scrolled75 = false;
window.addEventListener('scroll', () => {
    if (!scrolled75) {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        if (scrollPercent >= 75) {
            trackEvent('scroll_75', { page: "home" });
            scrolled75 = true;
        }
    }
}, { passive: true });

// 3. click_demo_assistant
// Attach to all links pointing to #demo
document.querySelectorAll('a[href="#demo"]').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('click_demo_assistant', {
            channel: "web_demo",
            intent: "high"
        });
    });
});

// 4. start_demo_chat & 5. send_demo_message (Listeners for Iframe)
window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'DEMO_READY') {
        trackEvent('start_demo_chat', {
            demo_type: event.data.demo_type || "restaurant_simulation"
        });
    }

    if (event.data.type === 'DEMO_MESSAGE_SENT') {
        trackEvent('send_demo_message', {
            message_type: event.data.message_type || "order_simulation"
        });
    }

    if (event.data.type === 'DEMO_ORDER_SENT') {
        trackEvent('lead_generated', {
            source: 'demo_chat',
            product: 'ai_sales_assistant',
            value: event.data.items // Optional: track number of items
        });
    }
});

// 6. contact_whatsapp (Delegated listener)
document.addEventListener('click', (e) => {
    const btn = e.target.closest('a[href*="whatsapp.com"], a[href*="wa.me"]');
    if (btn) {
        trackEvent('contact_whatsapp', {
            location: "hero_section" // Simplification: assuming most are in similar context or we could check closest section
        });

        // Removed lead_generated from WhatsApp click as per refinement (Intent != Conversion)
    }
});
