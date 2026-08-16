# 🦑 HECTRON Studio — Modelo de Negocio SaaS

## La idea en una frase

**"Streamers con IA para TikTok Live sin programar"**: cualquier persona configura un presentador/vtuber/tarotista con IA en 5 minutos mediante un dashboard visual, y empieza a generar ingresos con TikTok Live.

---

## ¿Por qué somos pioneros?

Nadie ofrece hoy un sistema **todo-en-uno** que combine:
- IA que habla y responde al chat en tiempo real (Gemini, gratis)
- Voz realista (ElevenLabs)
- Avatar 3D con expresiones faciales (VSeeFace + OSC)
- Overlay 3D animado con mini-juegos
- Memoria de usuarios (recuerda quién volvió)
- Reacciones a regalos con efectos visuales únicos
- Cambio automático de escenas en PRISM Live Studio
- **Sin escribir una sola línea de código**

Todo configurado desde un dashboard web (`/studio`) o un asistente de terminal interactivo.

---

## Planes de suscripción

| Plan | Precio | Periodo | Incluye |
|------|--------|---------|---------|
| **Gratis** | $0 | semana | IA con Gemini, chat TikTok, overlay 3D básico, 1 stream |
| **Pro** | $9 | semana | Voz premium, avatar 3D, mini-juegos, efectos de donación, memoria VIP |
| **Emprende** | $29 | mes | Multi-stream (3 cuentas), visión IA, automatización PRISM, soporte prioritario |

### Estrategia de precios: "el plan se paga solo"

El usuario empieza gratis. Con 500 espectadores promedio en TikTok Live:

```
500 viewers × 2% que envían regalos = 10 regalos/día
10 regalos × $0.50 promedio = $5/día
$5/día × 30 días = $150/mes en ingresos de TikTok
```

- Plan Pro ($9/semana = ~$36/mes) → **neto +$114/mes**
- Plan Emprende ($29/mes) → **neto +$121/mes**

**El usuario nunca pierde**: las ganancias de TikTok cubren la suscripción con holgura.

---

## Arquitectura del SaaS

```
Usuario (sin programar)
    │
    ├── Dashboard web (/studio) — configura todo en 5 pasos
    │   1. Usuario de TikTok
    │   2. Personalidad (6 presets o custom)
    │   3. APIs (Gemini + ElevenLabs, ambas gratis)
    │   4. Plan (gratis/pro/emprende)
    │   5. Descargar .env y arrancar
    │
    ├── Asistente terminal (python -m leviatan.asistente)
    │   Misma configuración guiada por chat interactivo
    │
    └── Un comando lo arranca todo:
        python -m leviatan.main
```

### Stack técnico (todo gratuito para empezar)
- **Cerebro**: Google AI Studio (Gemini) — gratis
- **Voz**: ElevenLabs — tier gratuito
- **Chat**: TikTokLive — gratis
- **Cuerpo 3D**: VSeeFace + OSC — gratis
- **Overlay**: Three.js — gratis
- **PRISM**: automatización de escritorio — gratis
- **Telemetría**: SQLite local (sin GCP) — gratis
- **Hosting del dashboard**: Express en local o Vercel — gratis

---

## Flujo del usuario

1. **Descubre HECTRON Studio** → entra al dashboard web
2. **Configura en 5 minutos** → elige personalidad, pega 2 API keys gratis
3. **Descarga .env** → un archivo, sin programar
4. **Ejecuta un comando** → `python -m leviatan.main`
5. **Abre PRISM Live Studio** → añade el overlay como fuente de navegador
6. **Empieza a transmitir** → la IA habla, recuerda usuarios, reacciona a regalos
7. **TikTok le paga** → con 500 viewers gana ~$150/mes, la suscripción se paga sola

---

## Diferenciadores frente a la competencia

| Feature | HECTRON Studio | Streamlabs | OBS + Plugins | VTuber apps |
|---------|---------------|------------|----------------|-------------|
| IA que responde al chat | ✅ | ❌ | ❌ | ❌ |
| Configuración sin código | ✅ | Parcial | ❌ | Parcial |
| Voz IA realista | ✅ | ❌ | ❌ | ❌ |
| Avatar 3D con expresiones | ✅ | ❌ | Con plugins | ✅ |
| Mini-juegos en overlay | ✅ | ❌ | ❌ | ❌ |
| Memoria de usuarios | ✅ | ❌ | ❌ | ❌ |
| Reacciones a regalos | ✅ | Básico | ❌ | ❌ |
| Visión (analiza pantalla) | ✅ | ❌ | ❌ | ❌ |
| Cambio automático de escenas | ✅ | ❌ | Manual | ❌ |
| Precio desde | $0 | $0 | $0 | $0 |

**Ventaja clave**: somos los únicos que integran IA + voz + avatar + interacción + automatización en un solo producto no-code.

---

## Métricas objetivo

| Métrica | Mes 1-3 | Mes 4-6 | Mes 7-12 |
|---------|---------|---------|----------|
| Usuarios gratis | 100 | 500 | 2000 |
| Conversión a Pro | 5% | 8% | 12% |
| Usuarios Pro | 5 | 40 | 240 |
| MRR (ingresos recurrentes) | $180 | $1,440 | $8,640 |
| Usuarios Emprende | 1 | 5 | 20 |
| MRR Emprende | $29 | $145 | $580 |

---

## Roadmap

### Fase 1 — MVP (actual) ✅
- Dashboard no-code
- Asistente de terminal
- Leviatán completo (chat, voz, 3D, memoria, regalos)
- Overlay 3D con animaciones
- Mini-juegos y efectos de donación
- Visión con Gemini
- Telemetría local gratuita

### Fase 2 — Multi-plataforma (próximo)
- YouTube Live
- Twitch Chat
- Kick
- Instagram Live

### Fase 3 — Marketplace
- Plantillas de personalidades (creadas por la comunidad)
- Voces personalizadas clonadas
- Avatares 3D premium
- Comisión por venta (30%)

### Fase 4 — IA autónoma total
- El streamer decide cuándo transmitir
- Genera contenido solo (sin chat que lo active)
- Analiza métricas y optimiza horarios
- Post-clips automáticos a TikTok

---

## Por qué ahora

- **Gemini es gratis** → el coste de la IA es $0
- **TikTok Live paga regalos** → monetización inmediata
- **El VTubing crece** → demanda de avatares con IA
- **Nadie ofrece esto integrado** → ventana de oportunidad
- **El no-code es tendencia** → la gente no quiere programar

**El momento es ahora.**
