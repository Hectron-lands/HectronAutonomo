/**
 * HECTRON - Mini-juegos del Overlay
 *
 * Juegos interactivos que los espectadores activan desde el chat de TikTok:
 *   /trivia         — Pregunta de conocimiento, el Leviatán responde si acertaron
 *   /ruleta         — Ruleta cósmica, el destino decide la emoción del Leviatán
 *   /dados [número] — Los dados del destino (1-6), el Leviatán reacciona
 *   /duelo [usuario]— Desafío entre dos mortales
 */

const Minijuegos = {
    triviaActiva: null,
    ruletaGirando: false,

    // ─── TRIVIA: el Leviatán hace una pregunta de conocimiento real ──────────
    iniciarTrivia() {
        const preguntas = [
            { p: "¿Cuál es el planeta más grande del sistema solar?", r: "jupiter" },
            { p: "¿En qué año llegó el hombre a la Luna?", r: "1969" },
            { p: "¿Cuál es el río más largo del mundo?", r: "amazonas" },
            { p: "¿Quién pintó La Mona Lisa?", r: "davinci" },
            { p: "¿Cuál es el metal más ligero?", r: "litio" },
            { p: "¿En qué continente está Egipto?", r: "africa" },
            { p: "¿Cuántos huesos tiene el cuerpo humano adulto?", r: "206" },
            { p: "¿Cuál es la velocidad de la luz en km/s?", r: "300000" },
            { p: "¿Quién escribió Don Quijote?", r: "cervantes" },
            { p: "¿Cuál es el océano más grande?", r: "pacifico" }
        ];
        const pregunta = preguntas[Math.floor(Math.random() * preguntas.length)];
        this.triviaActiva = pregunta;
        OverlayUI.showNotification("🧠 TRIVIA: " + pregunta.p);
        OverlayUI.showNotification("💡 Responde en el chat. Pista: " + pregunta.r.substring(0, 1).toUpperCase() + "...");
        // Expirar tras 30 segundos
        setTimeout(() => {
            if (this.triviaActiva) {
                OverlayUI.showNotification("⏰ Nadie acertó. La respuesta era: " + pregunta.r);
                this.triviaActiva = null;
            }
        }, 30000);
    },

    verificarTriviaRespuesta(mensaje, username) {
        if (!this.triviaActiva) return false;
        const respuesta = mensaje.toLowerCase().trim();
        if (respuesta.includes(this.triviaActiva.r.toLowerCase())) {
            OverlayUI.showNotification("🎉 ¡" + username + " acertó! 🎉");
            if (typeof triggerEmotionPortal === 'function') triggerEmotionPortal('Joy');
            this.triviaActiva = null;
            return true;
        }
        return false;
    },

    // ─── RULETA CÓSMICA: el destino decide la emoción ───────────────────────
    girarRuleta() {
        if (this.ruletaGirando) return;
        this.ruletaGirando = true;
        OverlayUI.showNotification("🎡 Ruleta cósmica girando...");
        const emociones = ['Joy', 'Angry', 'Sorrow', 'Fun', 'Neutral'];
        let ticks = 0;
        const intervalo = setInterval(() => {
            const emo = emociones[Math.floor(Math.random() * emociones.length)];
            OverlayUI.showNotification("🎲 " + emo + "...");
            ticks++;
            if (ticks >= 8) {
                clearInterval(intervalo);
                const final = emociones[Math.floor(Math.random() * emociones.length)];
                OverlayUI.showNotification("✨ El destino ha decidido: " + final);
                if (typeof triggerEmotionPortal === 'function') triggerEmotionPortal(final);
                this.ruletaGirando = false;
            }
        }, 400);
    },

    // ─── DADOS DEL DESTINO: un número del 1 al 6 ────────────────────────────
    tirarDados(numeroPedido, username) {
        const resultado = Math.floor(Math.random() * 6) + 1;
        const acierto = numeroPedido && parseInt(numeroPedido) === resultado;
        OverlayUI.showNotification(`🎲 ${username} tiró los dados... salió ${resultado}!`);
        if (acierto) {
            OverlayUI.showNotification("🔥 ¡ACERTASTE! El Leviatán se impresiona.");
            if (typeof triggerEmotionPortal === 'function') triggerEmotionPortal('Fun');
        } else {
            const emo = resultado >= 4 ? 'Joy' : 'Sorrow';
            if (typeof triggerEmotionPortal === 'function') triggerEmotionPortal(emo);
        }
    },

    // ─── DUELO: dos mortales se desafían ────────────────────────────────────
    duelo(retador, retado) {
        OverlayUI.showNotification(`⚔️ ${retador} desafía a ${retado}!`);
        const tirada1 = Math.floor(Math.random() * 100) + 1;
        const tirada2 = Math.floor(Math.random() * 100) + 1;
        setTimeout(() => {
            OverlayUI.showNotification(`🗡️ ${retador}: ${tirada1} vs ${retado}: ${tirada2}`);
            setTimeout(() => {
                if (tirada1 > tirada2) {
                    OverlayUI.showNotification(`👑 ${retador} gana el duelo!`);
                    if (typeof triggerEmotionPortal === 'function') triggerEmotionPortal('Joy');
                } else if (tirada2 > tirada1) {
                    OverlayUI.showNotification(`👑 ${retado} gana el duelo!`);
                    if (typeof triggerEmotionPortal === 'function') triggerEmotionPortal('Joy');
                } else {
                    OverlayUI.showNotification("🤝 ¡Empate épico!");
                    if (typeof triggerEmotionPortal === 'function') triggerEmotionPortal('Fun');
                }
            }, 1500);
        }, 1500);
    },

    // ─── Procesar comandos de juegos desde el chat ─────────────────────────
    procesarComando(mensaje, username) {
        const msg = mensaje.toLowerCase().trim();
        if (msg === "/trivia") { this.iniciarTrivia(); return true; }
        if (msg === "/ruleta") { this.girarRuleta(); return true; }
        if (msg.startsWith("/dados")) {
            const num = msg.split(" ")[1];
            this.tirarDados(num, username);
            return true;
        }
        if (msg.startsWith("/duelo ")) {
            const retado = mensaje.substring(7).trim();
            if (retado) { this.duelo(username, retado); return true; }
        }
        // Verificar respuesta de trivia activa
        if (this.verificarTriviaRespuesta(mensaje, username)) return true;
        return false;
    }
};

window.Minijuegos = Minijuegos;
