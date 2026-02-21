// Encapsulate everything to avoid global scope pollution
(function () {
    function initChat() {
        // --- LÓGICA DE NEGOCIO ORIGINAL CONSERVARADA ---
        // NO MODIFICAR: webhook / ids / payload
        const WEBHOOK_URL = "https://n8n.srv1409578.hstgr.cloud/webhook/iagency/webchat";
        const BUSINESS_ID = "burger_house";
        const USER_ID = "cliente_" + Math.random().toString(36).slice(2, 6);

        // DOM Elements
        const messagesEl = document.getElementById("chatMessages");
        const formEl = document.getElementById("chatForm");
        const inputEl = document.getElementById("chatInput");
        const sendBtn = document.getElementById("sendButton");
        const statusText = document.getElementById("statusText");
        const negocioLabel = document.getElementById("negocioLabel");
        const userIdLabel = document.getElementById("userIdLabel");

        const openCartBtn = document.getElementById("openCartBtn");
        const cartCountEl = document.getElementById("cartCount");

        const drawerEl = document.getElementById("drawer");
        const drawerCloseEl = document.getElementById("drawerClose");
        const drawerTitleEl = document.getElementById("drawerTitle");
        const drawerBodyEl = document.getElementById("drawerBody");
        const drawerFooterEl = document.getElementById("drawerFooter");
        const drawerCartBtnEl = document.getElementById("drawerCartBtn");
        const businessInfoEl = document.getElementById("businessInfo");
        const floatingCartBtnEl = document.getElementById("floatingCartBtn");
        const floatingCartCountEl = document.getElementById("floatingCartCount");

        const cartItemsLabel = document.getElementById("cartItemsLabel");
        const cartTotalLabel = document.getElementById("cartTotalLabel");
        const sendOrderBtn = document.getElementById("sendOrderBtn");
        const continueShoppingBtn = document.getElementById("continueShoppingBtn");
        const clearCartBtn = document.getElementById("clearCartBtn");

        // New Floating Chat Cart Button
        const chatFloatingCartBtn = document.getElementById("chatFloatingCartBtn");
        const chatFloatingCartCount = document.getElementById("chatFloatingCartCount");

        // Init UI Text
        // if (negocioLabel) negocioLabel.textContent = "ABIERTO";
        // if (userIdLabel) userIdLabel.textContent = "ID: " + USER_ID;

        // ---- Catálogo ----
        const CATALOG = {
            "Hamburguesas": [
                { name: "Burger Clásica", desc: "Carne, queso, lechuga, tomate y salsa de la casa.", price: 8.99 },
                { name: "Burger Doble", desc: "Doble carne, doble queso. Para hambre seria.", price: 11.99 },
                { name: "Burger Pollo Crispy", desc: "Pollo crocante, lechuga, mayo y pepinillos.", price: 9.99 },
                { name: "Burger Veggie", desc: "Medallón veggie, queso, rúcula y tomate.", price: 9.49 },
            ],
            "Papas": [
                { name: "Papas Chicas", desc: "Clásicas, crocantes y doradas.", price: 2.99 },
                { name: "Papas Grandes", desc: "Para compartir (o no).", price: 3.99 },
                { name: "Papas con Cheddar", desc: "Cheddar + toque de cebolla crispy.", price: 4.99 },
            ],
            "Bebidas": [
                { name: "Coca Cola", desc: "Lata / 355 ml (según disponibilidad).", price: 2.0 },
                { name: "Agua", desc: "Agua sin gas.", price: 1.5 },
                { name: "Cerveza", desc: "Cerveza rubia (consulta marcas).", price: 3.5 },
            ],
            "Extras": [
                { name: "Extra Queso", desc: "Sumá queso a tu burger.", price: 1.0 },
                { name: "Extra Bacon", desc: "Bacon crocante.", price: 1.5 },
                { name: "Salsa Especial", desc: "Salsa de la casa (extra).", price: 0.8 },
            ],
        };

        // ---- Carrito Logic ----
        const CART_KEY = `burger_cart_${USER_ID}`;
        let cart = [];
        let drawerMode = "catalog"; // "catalog" | "cart"

        try {
            const raw = localStorage.getItem(CART_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) cart = parsed;
            }
        } catch (e) { console.error("Error loading cart", e); }

        function saveCart() {
            try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { }
        }

        function clearCart() {
            cart = [];
            saveCart();
            syncCartUI();
        }

        function money(n) {
            const num = Number(n || 0);
            return "US$ " + num.toFixed(2);
        }

        function nowHHMM() {
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            return `${hh}:${mm}`;
        }

        function cartTotals() {
            const subtotal = cart.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.qty || 0)), 0);
            const items = cart.reduce((acc, i) => acc + Number(i.qty || 0), 0);
            return { subtotal, items };
        }

        function syncCartUI() {
            const t = cartTotals();
            if (cartCountEl) cartCountEl.textContent = String(t.items);
            if (cartItemsLabel) cartItemsLabel.textContent = `${t.items} ítems`;
            if (cartTotalLabel) cartTotalLabel.textContent = money(t.subtotal);

            // Update Floating Chat Button
            // VISIBILITY RULE: Only show if items > 0 AND Drawer is CLOSED
            const isDrawerOpen = drawerEl && drawerEl.classList.contains("open");

            if (chatFloatingCartBtn && chatFloatingCartCount) {
                if (t.items > 0 && !isDrawerOpen) {
                    chatFloatingCartBtn.style.display = "flex";
                    chatFloatingCartCount.textContent = String(t.items);
                } else {
                    chatFloatingCartBtn.style.display = "none";
                }
            }

            // WhatsApp Style: show sticky bottom cart button in catalog mode if items > 0
            if (drawerMode === "catalog" && t.items > 0) {
                if (floatingCartBtnEl) {
                    floatingCartBtnEl.classList.add("visible");
                    if (floatingCartCountEl) floatingCartCountEl.textContent = String(t.items);
                }
            } else {
                if (floatingCartBtnEl) floatingCartBtnEl.classList.remove("visible");
            }
        }

        // ---- Mensajes Logic ----
        function addMessage(text, from = "bot", opts = {}) {
            if (!messagesEl) return;
            const row = document.createElement("div");
            row.className = "message-row " + (from === "user" ? "user" : "bot");

            const bubble = document.createElement("div");
            bubble.className = from === "user" ? "message-bubble user-bubble" : "message-bubble bot-bubble";

            const content = document.createElement("div");

            // Render TEXT or ACTION BUTTON based on specific line matching
            // We split by newlines to respect line breaks and identify the action line
            const lines = text.split('\n');

            lines.forEach((line, index) => {
                const cleanLine = line.trim();

                // Check for catalog trigger: "Ver catálogo" (case-insensitive)
                const isCatalogTrigger = /ver cat[áa]logo/i.test(cleanLine);

                if (from === "bot" && isCatalogTrigger) {
                    const btn = document.createElement("button");
                    btn.className = "primary-btn";

                    // Keep original text, but maybe clean it up if it's too long?
                    // User requirement: "Cualquier línea que contenga “Ver catálogo”"
                    // User also said: "Mantener textContent para el resto de líneas".
                    // For the button text, let's execute the user request:
                    // "En vez de mostrar esa línea como texto, reemplazarla por un elemento clickeable: un botón... texto 'Ver catálogo'"
                    // Wait, the user said: "Opción recomendada: un botón ... texto “Ver catálogo”."
                    // So I should probably set the text to "Ver catálogo" explicitly instead of the full line if it contains a URL.
                    // However, the example shows: "👉 Ver catálogo: https://..."
                    // If I replace line with button "Ver catálogo", the URL info is hidden (which is fine as it's the target).
                    // Let's set the text to "Ver catálogo" to be clean, or "👉 Ver catálogo" if passing the emoji.
                    // Actually, let's keep it simple: "Ver catálogo" as user requested text.

                    btn.textContent = "Ver catálogo";

                    // Extract URL if present, but prioritize local catalog for specific domain
                    const urlMatch = cleanLine.match(/(https?:\/\/\S+)/);
                    let targetUrl = urlMatch ? urlMatch[0] : "catalogo.html";

                    // User requested to use local file instead of this specific external URL
                    if (targetUrl.includes("catalogo.helloiagency.com")) {
                        targetUrl = "catalogo.html";
                    }

                    // Inline styles to fit message bubble better
                    btn.style.marginTop = "8px";
                    btn.style.width = "auto";
                    btn.style.padding = "8px 16px";
                    btn.style.fontSize = "14px";
                    btn.style.display = "inline-block";

                    btn.onclick = () => window.openCatalog(targetUrl);

                    content.appendChild(btn);
                } else {
                    // Regular text line
                    const span = document.createElement("div");
                    span.textContent = line;
                    // Preserve empty lines visually
                    if (line === '') span.style.minHeight = '1em';
                    content.appendChild(span);
                }
            });

            const meta = document.createElement("div");
            meta.className = "msg-meta";

            const time = document.createElement("span");
            time.textContent = opts.time || nowHHMM();
            meta.appendChild(time);

            if (from === "user") {
                const ticks = document.createElement("span");
                ticks.className = "ticks";
                ticks.textContent = "✓";
                meta.appendChild(ticks);

                setTimeout(() => { ticks.textContent = "✓✓"; }, 350);
                setTimeout(() => { ticks.classList.add("read"); }, 1200);
            }

            bubble.appendChild(content);
            bubble.appendChild(meta);
            row.appendChild(bubble);

            messagesEl.appendChild(row);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return row;
        }

        function setStatus(text, isError = false) {
            if (!statusText) return;
            statusText.textContent = text;
            statusText.style.color = isError ? "#ef4444" : "rgba(148, 163, 184, 0.95)";
            const line = document.querySelector(".status-line");
            if (line) line.style.display = text ? "block" : "none";
        }

        // ---- Typing Indicator ----
        let typingRow = null;
        function showTypingIndicator() {
            if (typingRow || !messagesEl) return;
            typingRow = document.createElement("div");
            typingRow.className = "message-row bot";
            typingRow.innerHTML = `
        <div class="typing-bubble">
          <div class="typing-dots"><span></span><span></span><span></span></div>
          <span style="font-size:12px;color:rgba(233,237,239,0.75)">escribiendo</span>
        </div>`;
            messagesEl.appendChild(typingRow);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function hideTypingIndicator() {
            if (!typingRow) return;
            typingRow.remove();
            typingRow = null;
        }

        // ---- Catalog Modal Logic ----
        const catalogModal = document.getElementById("catalogModal");
        const catalogFrame = document.getElementById("catalogFrame");
        const closeCatalogBtn = document.getElementById("closeCatalogBtn");

        function openCatalogModal(url) {
            if (!catalogModal) return;

            // Determine URL (use passed url if string, else default)
            // handle event object being passed by onclick if no args
            let targetSrc = "catalogo.html";
            if (typeof url === "string" && url.trim().length > 0) {
                targetSrc = url.trim();
            }

            // Always update src to ensure we load the right content
            // Check if current src is different to avoid reload if same (optional, but good for perf)
            // But if user wants to ensure it opens "that" catalog, maybe force it?
            // Let's update it.
            if (catalogFrame.getAttribute("src") !== targetSrc) {
                catalogFrame.src = targetSrc;
            }

            catalogModal.style.display = "flex";
        }

        function closeCatalogModal() {
            if (!catalogModal) return;
            catalogModal.style.display = "none";
        }

        if (closeCatalogBtn) {
            closeCatalogBtn.addEventListener("click", closeCatalogModal);
        }

        // Expose for usage in button onclick
        window.openCatalog = openCatalogModal;

        // ---- Webhook & Message Logic ----
        async function sendToWebhook(text) {
            // NOTE: Removed local interception. We rely 100% on n8n for responses.
            showTypingIndicator();

            try {
                // Fixed Payload structure matching the working version
                const payload = {
                    id_negocio: BUSINESS_ID,
                    user_id: USER_ID,
                    texto: text
                };

                const res = await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json().catch(() => null);
                hideTypingIndicator();

                if (!res.ok) {
                    addMessage("Tuvimos un problema con el pedido (Error servidor).", "bot");
                    setStatus("Error de servicio", true);
                    return;
                }

                // Handle various response keys from n8n (reply/respuesta/message)
                let replyText = (data && (data.reply || data.respuesta || data.message)) || "Pedido recibido.";

                addMessage(replyText, "bot");

            } catch (err) {
                console.error("Webhook Error:", err);
                hideTypingIndicator();
                setStatus("Error de conexión", true);
                setTimeout(() => {
                    addMessage("⚠️ No pudimos conectar con el local.", "bot");
                }, 500);
            }
        }


        // ---- Drawer Helper (Legacy/Internal Chat Cart) ----
        function openDrawer(mode) {
            // ... (Existing Drawer Logic kept if needed, although we are moving to external catalog)
            // For this task, we focus on the external catalog flow.
            // If user clicks internal cart buttons, we could also redirect to external catalog or keep internal logic.
            // The prompt says "Simulate flow using external catalog".
            // Let's assume internal specific buttons (if any left valid) still work, but main flow is external.
            if (!drawerEl) return;
            drawerMode = mode;
            drawerEl.classList.add("open");
            drawerEl.classList.toggle("dark", mode === "cart");
            drawerBodyEl.innerHTML = "";

            if (mode === "catalog") {
                drawerTitleEl.textContent = "Catálogo";
                drawerCloseEl.textContent = "Cancelar";
                drawerCartBtnEl.style.display = "block";
                businessInfoEl.style.display = "block";
                drawerFooterEl.style.display = "none";
                renderCatalog();
                syncCartUI();
            } else {
                drawerTitleEl.textContent = "Tu carrito";
                drawerCloseEl.textContent = "Cerrar";
                drawerCartBtnEl.style.display = "none";

                // "Añadir más" button
                let addMore = document.getElementById("headerAddMore");
                if (!addMore) {
                    addMore = document.createElement("button");
                    addMore.id = "headerAddMore";
                    addMore.className = "ghost-btn";
                    addMore.style.color = "white";
                    addMore.textContent = "Añadir más";
                    addMore.addEventListener("click", () => openDrawer("catalog"));
                    drawerCartBtnEl.parentNode.appendChild(addMore);
                }
                addMore.style.display = "block";

                businessInfoEl.style.display = "none";
                floatingCartBtnEl.classList.remove("visible");
                drawerFooterEl.style.display = "flex";
                renderCart();
            }
        }
        // expose to window if needed by inline handlers
        window.openDrawer = openDrawer;

        function closeDrawer() {
            if (!drawerEl) return;
            drawerEl.classList.remove("open");
            drawerEl.classList.remove("dark");
            drawerBodyEl.innerHTML = "";
            const addMore = document.getElementById("headerAddMore");
            if (addMore) addMore.style.display = "none";
            syncCartUI(); // Re-evaluate visibility of floating button
        }

        // ---- Catalog Render ----
        function renderCatalog() {
            // ... existing renderCatalog logic ...
            // (We keep this for fallback or mixed use, but the external catalog is priority)
            drawerBodyEl.innerHTML = "";
            Object.keys(CATALOG).forEach(category => {
                const catHead = document.createElement("div");
                catHead.className = "category-header";
                catHead.innerHTML = `<h3>${category}</h3>`;
                drawerBodyEl.appendChild(catHead);

                (CATALOG[category] || []).forEach(p => {
                    const row = document.createElement("div");
                    row.className = "product-card";

                    const img = document.createElement("div");
                    img.className = "product-img";
                    img.textContent = category === "Hamburguesas" ? "🍔" :
                        category === "Papas" ? "🍟" :
                            category === "Bebidas" ? "🥤" : "✨";

                    const info = document.createElement("div");
                    info.className = "product-info";

                    const name = document.createElement("div");
                    name.className = "product-name";
                    name.textContent = p.name;

                    const desc = document.createElement("div");
                    desc.className = "product-desc";
                    desc.textContent = p.desc || "";

                    const bottom = document.createElement("div");
                    bottom.className = "product-bottom";

                    const price = document.createElement("div");
                    price.className = "product-price";
                    price.textContent = money(p.price);

                    const addBtn = document.createElement("button");
                    addBtn.type = "button";
                    addBtn.className = "add-btn-circle";
                    addBtn.textContent = "+";
                    addBtn.addEventListener("click", () => {
                        addToCart({ ...p, category }, 1);
                        syncCartUI();
                    });

                    bottom.appendChild(price);
                    bottom.appendChild(addBtn);
                    info.appendChild(name);
                    info.appendChild(desc);
                    info.appendChild(bottom);
                    row.appendChild(img);
                    row.appendChild(info);
                    drawerBodyEl.appendChild(row);
                });
            });
        }

        function addToCart(product, qty) {
            // ... existing addToCart logic ...
            const existing = cart.find(i => i.name === product.name);
            if (existing) existing.qty += qty;
            else {
                cart.push({
                    name: product.name,
                    qty: qty,
                    price: Number(product.price || 0),
                    category: product.category || ""
                });
            }
            saveCart();
        }

        // ---- Cart Render ----
        function renderCart() {
            // ... existing renderCart logic ...
            drawerBodyEl.innerHTML = "";

            if (!cart.length) {
                const empty = document.createElement("div");
                empty.style.padding = "40px 20px";
                empty.style.textAlign = "center";
                empty.style.color = "#667781";
                empty.innerHTML = `
          <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">Tu carrito está vacío</div>
          <p style="font-size: 14px;">Elegí productos del catálogo para enviarlos todos juntos.</p>
        `;
                drawerBodyEl.appendChild(empty);
                syncCartUI();
                return;
            }

            cart.forEach((item) => {
                const row = document.createElement("div");
                row.className = "cart-item";
                row.style.display = "flex";
                row.style.alignItems = "center";

                const img = document.createElement("div");
                img.className = "cart-item-img";
                img.textContent = item.category === "Hamburguesas" ? "🍔" :
                    item.category === "Papas" ? "🍟" :
                        item.category === "Bebidas" ? "🥤" : "✨";

                const itemContent = document.createElement("div");
                itemContent.className = "cart-item-content";

                const top = document.createElement("div");
                top.className = "cart-item-top";

                const left = document.createElement("div");
                const name = document.createElement("div");
                name.className = "cart-item-name";
                name.textContent = item.name;

                const sub = document.createElement("div");
                sub.className = "cart-item-sub";
                sub.textContent = `${money(item.price)} · ${item.category || ""}`.trim();

                left.appendChild(name);
                left.appendChild(sub);

                const right = document.createElement("div");
                right.className = "cart-item-right";
                right.textContent = money(item.price * item.qty);

                top.appendChild(left);
                top.appendChild(right);

                const actions = document.createElement("div");
                actions.className = "cart-item-actions";

                const qtyWrap = document.createElement("div");
                qtyWrap.className = "qty";

                const minus = document.createElement("button");
                minus.type = "button";
                minus.textContent = "–";
                minus.addEventListener("click", () => {
                    updateQty(item.name, item.qty - 1);
                    renderCart();
                });

                const qtyLabel = document.createElement("span");
                qtyLabel.textContent = String(item.qty);

                const plus = document.createElement("button");
                plus.type = "button";
                plus.textContent = "+";
                plus.addEventListener("click", () => {
                    updateQty(item.name, item.qty + 1);
                    renderCart();
                });

                qtyWrap.appendChild(minus);
                qtyWrap.appendChild(qtyLabel);
                qtyWrap.appendChild(plus);

                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "remove-btn";
                remove.textContent = "Eliminar";
                remove.addEventListener("click", () => {
                    removeItem(item.name);
                    renderCart();
                });

                actions.appendChild(qtyWrap);
                actions.appendChild(remove);

                itemContent.appendChild(top);
                itemContent.appendChild(actions);

                row.appendChild(img);
                row.appendChild(itemContent);
                drawerBodyEl.appendChild(row);
            });

            syncCartUI();
        }

        function updateQty(name, newQty) {
            // ... existing updateQty logic ...
            const idx = cart.findIndex(i => i.name === name);
            if (idx === -1) return;
            if (newQty <= 0) cart.splice(idx, 1);
            else cart[idx].qty = Math.min(99, newQty);
            saveCart();
            syncCartUI();
        }

        function removeItem(name) {
            // ... existing removeItem logic ...
            cart = cart.filter(i => i.name !== name);
            saveCart();
            syncCartUI();
        }

        function buildSingleOrderMessage() {
            // ... (Keep existing if needed, though external catalog sends formatted text) ...
            const t = cartTotals();
            const lines = [];
            lines.push("Pedido Burger House:");
            cart.forEach(i => {
                lines.push(`- ${i.qty}× ${i.name}`);
            });
            lines.push(`Total estimado: ${money(t.subtotal)}`);
            return lines.join("\n");
        }

        // ---- Event Listeners ----
        if (drawerCloseEl) drawerCloseEl.addEventListener("click", closeDrawer);
        if (drawerCartBtnEl) drawerCartBtnEl.addEventListener("click", () => openDrawer("cart"));
        if (floatingCartBtnEl) floatingCartBtnEl.addEventListener("click", () => openDrawer("cart"));
        if (openCartBtn) openCartBtn.addEventListener("click", () => openDrawer("catalog"));
        if (continueShoppingBtn) continueShoppingBtn.addEventListener("click", () => openDrawer("catalog"));

        if (clearCartBtn) {
            clearCartBtn.addEventListener("click", () => {
                clearCart();
                renderCart();
                setStatus("Carrito vaciado.");
            });
        }

        // Toggle Mic/Send Icon
        function updateSendButtonState() {
            if (!inputEl || !sendBtn) return;
            const hasText = inputEl.value.trim().length > 0;

            // If has text, show PLANE (Send). If empty, show MIC.
            if (hasText) {
                sendBtn.innerHTML = `
                <svg viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                </svg>`;
                sendBtn.setAttribute("aria-label", "Enviar");
            } else {
                sendBtn.innerHTML = `
                <svg viewBox="0 0 24 24" class="mic-icon">
                   <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm4.338-3.531H15.63c-.36 3.016-2.912 5.258-5.95 5.258-3.037 0-5.59-2.242-5.95-5.258H3.023c.382 4.14 3.652 7.425 7.794 7.828v2.76h2.365v-2.76c4.142-.403 7.412-3.688 7.794-7.828z"></path>
                </svg>`;
                sendBtn.setAttribute("aria-label", "Grabar nota de voz");
            }
        }

        if (inputEl) {
            inputEl.addEventListener("input", updateSendButtonState);
            // Run once on init
            updateSendButtonState();
        }

        // Send Message
        if (formEl) {
            formEl.addEventListener("submit", (e) => {
                e.preventDefault();
                const text = inputEl.value.trim();

                // If empty/Mic mode, we don't send text (voice logic unimplemented)
                if (!text) {
                    console.log("Mic clicked (voice note feature not implemented)");
                    return;
                }

                inputEl.value = "";
                updateSendButtonState(); // Reset to Mic
                addMessage(text, "user");
                sendToWebhook(text);

                // GA4 Tracking Event
                window.parent.postMessage({ type: "DEMO_MESSAGE_SENT", message_type: "text_message" }, "*");
            });

            // Handle button click directly
            if (sendBtn) {
                sendBtn.addEventListener("click", (e) => {
                    const text = inputEl.value.trim();
                    if (!text) {
                        e.preventDefault();
                        console.log("Mic clicked (voice not implemented)");
                        return;
                    }

                    // If text exists, send message
                    e.preventDefault();
                    inputEl.value = "";
                    updateSendButtonState();
                    addMessage(text, "user");
                    sendToWebhook(text);

                    // GA4 Tracking Event
                    window.parent.postMessage({ type: "DEMO_MESSAGE_SENT", message_type: "text_message" }, "*");
                });
            }
        }

        // Send Order (Legacy Internal Button)
        if (sendOrderBtn) {
            // ... (kept for backward compatibility with internal cart if button exists)
            sendOrderBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (!cart.length) {
                    setStatus("Tu carrito está vacío.", true);
                    return;
                }
                const originalText = sendOrderBtn.textContent;
                sendOrderBtn.textContent = "Procesando...";
                sendOrderBtn.disabled = true;
                const orderText = buildSingleOrderMessage();
                closeDrawer();
                addMessage(orderText, "user");
                sendToWebhook(orderText)
                    .then(() => {
                        clearCart();
                        // GA4 Conversion
                        window.parent.postMessage({ type: "DEMO_ORDER_SENT", items: cart.length }, "*");
                    })
                    .catch(e => setStatus("Error al enviar.", true))
                    .finally(() => {
                        sendOrderBtn.textContent = originalText;
                        sendOrderBtn.disabled = false;
                    });
            });
        }

        // Floating Chat Cart Button Click
        if (chatFloatingCartBtn) {
            chatFloatingCartBtn.addEventListener("click", () => {
                openDrawer("cart");
            });
        }

        // Init Logic
        setTimeout(() => {
            addMessage("¡Hola! 👋\nEsta es una simulación de WhatsApp para tomar pedidos automáticamente.\n\n✍️ Escribí \"Quiero hacer un pedido\" para comenzar.\nLeo, tu asistente, te guiará paso a paso.", "bot");
        }, 450);



        syncCartUI();

        // Listen for messages from parent window (Demo Buttons)
        window.addEventListener("message", (event) => {
            // Existing Demo logic
            if (event.data && event.data.type === "DEMO_MSG") {
                const text = event.data.text;
                if (text) {
                    addMessage(text, "user");
                    sendToWebhook(text);
                }
            }

            // NEW: Listen for messages from External Catalog via Iframe
            if (event.data && event.data.type === "ORDER_FROM_CATALOG") {
                const orderText = event.data.text;
                if (orderText) {
                    closeCatalogModal();
                    addMessage(orderText, "user");
                    sendToWebhook(orderText); // Process as if user typed it
                }
            }
        });

        // Notify parent that demo is ready
        window.parent.postMessage({ type: "DEMO_READY", demo_type: "restaurant_simulation" }, "*");
    }

    // Robust initialization
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initChat);
    } else {
        initChat();
    }
})();
