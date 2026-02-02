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
document.addEventListener("click", e => {
    const btn = e.target.closest(".example-msg-btn");
    if (!btn) return;

    e.preventDefault();

    // Scroll to chat
    const demoSection = document.getElementById("demo");
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
});

// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}
