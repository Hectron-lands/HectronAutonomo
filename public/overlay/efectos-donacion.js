/**
 * HECTRON - Efectos visuales únicos por tipo de regalo/donación
 *
 * Cada regalo de TikTok dispara un efecto visual distinto en el overlay:
 *   Rosa          → lluvia de pétalos rosas
 *   León          → rugido con onda expansiva dorada
 *   Universo      → galaxia en espiral
 *   Corazón       → explosión de corazones
 *   Tigre         → rayas de energía naranja
 *   Cualquier otro→ confeti
 */

const EfectosDonacion = {

    // ─── Mapeo regalo → efecto ──────────────────────────────────────────────
    MAPEO: {
        "rose": "petalos", "rosa": "petalos",
        "lion": "leon", "león": "leon",
        "universe": "galaxia", "universo": "galaxia",
        "heart": "corazones", "corazón": "corazones", "corazon": "corazones",
        "tiger": "tigre", "tigre": "tigre"
    },

    // ─── Disparar efecto según el regalo ────────────────────────────────────
    disparar(nombreRegalo, cantidad, username) {
        const efecto = this.MAPEO[nombreRegalo.toLowerCase()] || "confeti";
        OverlayUI.showNotification(`💎 ${username} envió ${cantidad}x ${nombreRegalo}!`);

        switch (efecto) {
            case "petalos": this._petalos(cantidad); break;
            case "leon": this._leon(); break;
            case "galaxia": this._galaxia(); break;
            case "corazones": this._corazones(cantidad); break;
            case "tigre": this._tigre(); break;
            default: this._confeti(cantidad); break;
        }

        // El portal de emoción siempre se activa con regalos
        if (typeof triggerEmotionPortal === 'function') triggerEmotionPortal('Joy');
    },

    // ─── Lluvia de pétalos rosas ────────────────────────────────────────────
    _petalos(cantidad) {
        const total = Math.min(cantidad * 5, 100);
        for (let i = 0; i < total; i++) {
            this._crearParticulaCSS('🌸', Math.random() * window.innerWidth, -20, 0xff69b4);
        }
    },

    // ─── Rugido del león: onda expansiva dorada ─────────────────────────────
    _leon() {
        const onda = document.createElement('div');
        onda.style.cssText = `position:fixed;top:50%;left:50%;width:10px;height:10px;
            border-radius:50%;border:4px solid #ffd700;
            box-shadow:0 0 30px #ffd700;transform:translate(-50%,-50%);
            z-index:15;pointer-events:none;transition:all 1.5s ease;`;
        document.body.appendChild(onda);
        requestAnimationFrame(() => {
            onda.style.width = window.innerWidth + 'px';
            onda.style.height = window.innerWidth + 'px';
            onda.style.opacity = '0';
            onda.style.borderWidth = '1px';
        });
        setTimeout(() => onda.remove(), 1600);
        OverlayUI.showNotification("🦁 ¡EL LEVIATÁN RUGE!");
    },

    // ─── Galaxia en espiral ─────────────────────────────────────────────────
    _galaxia() {
        const centro = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        for (let i = 0; i < 80; i++) {
            const angulo = (i / 80) * Math.PI * 6;
            const radio = (i / 80) * 200;
            setTimeout(() => {
                this._crearParticulaCSS('✨',
                    centro.x + Math.cos(angulo) * radio,
                    centro.y + Math.sin(angulo) * radio,
                    i % 2 ? 0x6a0dad : 0x1e90ff
                );
            }, i * 20);
        }
        OverlayUI.showNotification("🌌 ¡GALAXIA DESATADA!");
    },

    // ─── Explosión de corazones ─────────────────────────────────────────────
    _corazones(cantidad) {
        const total = Math.min(cantidad * 3, 60);
        for (let i = 0; i < total; i++) {
            const x = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
            const y = window.innerHeight / 2 + (Math.random() - 0.5) * 100;
            this._crearParticulaCSS('❤️', x, y, 0xff3366);
        }
    },

    // ─── Rayas de energía naranja (tigre) ───────────────────────────────────
    _tigre() {
        for (let i = 0; i < 20; i++) {
            const raya = document.createElement('div');
            raya.style.cssText = `position:fixed;top:0;left:${Math.random() * 100}%;
                width:${5 + Math.random() * 15}px;height:100%;
                background:linear-gradient(180deg,transparent,#ff6600,transparent);
                z-index:15;pointer-events:none;opacity:0.7;
                transition:all 0.8s ease;`;
            document.body.appendChild(raya);
            setTimeout(() => { raya.style.opacity = '0'; raya.style.transform = 'scaleY(2)'; }, 50);
            setTimeout(() => raya.remove(), 900);
        }
        OverlayUI.showNotification("🐯 ¡FUERZA DEL TIGRE!");
    },

    // ─── Confeti genérico ──────────────────────────────────────────────────
    _confeti(cantidad) {
        const colores = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        const total = Math.min(cantidad * 8, 150);
        for (let i = 0; i < total; i++) {
            const emoji = ['🎉', '🎊', '✨', '⭐', '💫'][Math.floor(Math.random() * 5)];
            const color = colores[Math.floor(Math.random() * colores.length)];
            this._crearParticulaCSS(emoji, Math.random() * window.innerWidth, -20, color);
        }
    },

    // ─── Helper: crear partícula con física simple ─────────────────────────
    _crearParticulaCSS(emoji, x, y, color) {
        const el = document.createElement('div');
        el.textContent = emoji;
        el.style.cssText = `position:fixed;left:${x}px;top:${y}px;font-size:${12 + Math.random() * 16}px;
            z-index:15;pointer-events:none;transition:all 3s ease;
            color:#${color.toString(16).padStart(6, '0')};text-shadow:0 0 8px #${color.toString(16).padStart(6, '0')};`;
        document.body.appendChild(el);
        // Animar caída
        requestAnimationFrame(() => {
            el.style.top = (window.innerHeight + 50) + 'px';
            el.style.left = (x + (Math.random() - 0.5) * 200) + 'px';
            el.style.opacity = '0';
            el.style.transform = `rotate(${Math.random() * 720}deg)`;
        });
        setTimeout(() => el.remove(), 3100);
    }
};

window.EfectosDonacion = EfectosDonacion;

// ─── OverlayUI: helper centralizado para notificaciones ─────────────────────
window.OverlayUI = window.OverlayUI || {
    showNotification(message) {
        const container = document.getElementById('event-notifications');
        if (!container) return;
        const n = document.createElement('div');
        n.className = 'event-notification';
        n.textContent = message;
        container.appendChild(n);
        setTimeout(() => { n.classList.add('fade-out'); setTimeout(() => n.remove(), 500); }, 4000);
    }
};
