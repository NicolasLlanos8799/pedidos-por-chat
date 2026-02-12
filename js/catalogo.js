// Encapsulate everything to avoid global scope pollution
(function () {
    function initCatalog() {
        // DOM Elements
        const drawerTitleEl = document.getElementById("drawerTitle");
        const drawerBodyEl = document.getElementById("drawerBody");
        const drawerFooterEl = document.getElementById("drawerFooter");
        const drawerCartBtnEl = document.getElementById("drawerCartBtn");
        const businessInfoEl = document.getElementById("businessInfo");
        const floatingCartBtnEl = document.getElementById("floatingCartBtn");
        const floatingCartCountEl = document.getElementById("floatingCartCount");

        const cartTotalLabel = document.getElementById("cartTotalLabel");
        const sendOrderBtn = document.getElementById("sendOrderBtn");

        // ---- Catálogo ----
        // Extracted from js/chat_hamburgueseria.js
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
        // Using a fixed ID for the standalone catalog, or generate one if needed.
        // For simplicity reusing a similar key pattern or just "burger_cart_catalog"
        const USER_ID = "guest";
        const CART_KEY = `burger_cart_standalone_${USER_ID}`;
        let cart = [];
        let drawerMode = "catalog"; // "catalog" | "cart"

        // Clear cart on reload (no persistence)
        try {
            localStorage.removeItem(CART_KEY);
        } catch (e) { }

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

        function cartTotals() {
            const subtotal = cart.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.qty || 0)), 0);
            const items = cart.reduce((acc, i) => acc + Number(i.qty || 0), 0);
            return { subtotal, items };
        }

        function syncCartUI() {
            const t = cartTotals();
            if (cartTotalLabel) cartTotalLabel.textContent = money(t.subtotal);

            // WhatsApp Style: show sticky bottom cart button in catalog mode if items > 0
            if (drawerMode === "catalog" && t.items > 0) {
                if (floatingCartBtnEl) {
                    floatingCartBtnEl.classList.add("visible");
                    floatingCartBtnEl.style.pointerEvents = "auto"; // Ensure it's clickable
                    if (floatingCartCountEl) floatingCartCountEl.textContent = String(t.items);
                }
            } else {
                if (floatingCartBtnEl) floatingCartBtnEl.classList.remove("visible");
            }
        }

        // ---- Switch Views Mocking Drawer Logic ----
        function switchView(mode) {
            drawerMode = mode;
            const drawerEl = document.getElementById("drawer");
            const leftActions = document.querySelector(".drawer-header .left-actions");

            // Toggle dark mode class if needed for consistency with original CSS (which uses .dark for cart)
            if (drawerEl) {
                drawerEl.classList.toggle("dark", mode === "cart");
            }

            drawerBodyEl.innerHTML = "";

            if (mode === "catalog") {
                drawerTitleEl.textContent = "Catálogo";
                drawerCartBtnEl.style.display = "block";
                businessInfoEl.style.display = "block";
                drawerFooterEl.style.display = "none";

                // Clear left actions (no back button on home)
                if (leftActions) leftActions.innerHTML = "";

                renderCatalog();
            } else {
                drawerTitleEl.textContent = "Tu carrito";
                drawerCartBtnEl.style.display = "none";

                // Add Back Button
                if (leftActions) {
                    leftActions.innerHTML = `
                        <button type="button" class="drawer-close" style="padding-right: 8px; display: flex; align-items: center; color: white;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: -2px;">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                        </button>`;
                    leftActions.querySelector("button").addEventListener("click", () => switchView("catalog"));
                }

                businessInfoEl.style.display = "none";
                floatingCartBtnEl.classList.remove("visible");
                drawerFooterEl.style.display = "flex";
                renderCart();
            }
            syncCartUI();
        }

        // ---- Catalog Render ----
        function renderCatalog() {
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
            const idx = cart.findIndex(i => i.name === name);
            if (idx === -1) return;
            if (newQty <= 0) cart.splice(idx, 1);
            else cart[idx].qty = Math.min(99, newQty);
            saveCart();
            syncCartUI();
        }

        function removeItem(name) {
            cart = cart.filter(i => i.name !== name);
            saveCart();
            syncCartUI();
        }

        // ---- Event Listeners ----
        if (drawerCartBtnEl) drawerCartBtnEl.addEventListener("click", () => switchView("cart"));
        if (floatingCartBtnEl) floatingCartBtnEl.addEventListener("click", () => switchView("cart"));

        // Send Order (External Catalog Mode)
        if (sendOrderBtn) {
            sendOrderBtn.addEventListener("click", () => {
                const t = cartTotals();
                if (t.items === 0) {
                    alert("Tu carrito está vacío.");
                    return;
                }

                const lines = [];
                lines.push("🛒 Pedido desde catálogo:");
                cart.forEach(i => {
                    lines.push(`• ${i.qty}x ${i.name}`);
                });
                lines.push(`*Total estimado: ${money(t.subtotal)}*`);

                const orderText = lines.join("\n");

                console.log("Sending order from catalog to chat:", orderText);

                // Send to parent window (Chat Demo)
                // Use '*' for demo purposes, or restrict if domain is known
                if (window.parent) {
                    window.parent.postMessage({
                        type: 'ORDER_FROM_CATALOG',
                        text: orderText
                    }, '*');
                } else {
                    console.warn("No parent window found to send order.");
                    alert("Pedido simulado enviado:\n" + orderText);
                }

                // Clear cart and reset view
                clearCart();
                switchView("catalog");
            });
        }

        // Init
        renderCatalog();
        syncCartUI();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initCatalog);
    } else {
        initCatalog();
    }
})();
