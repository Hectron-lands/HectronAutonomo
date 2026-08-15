// HECTRON Studio API — endpoints del SaaS no-code
// Permite crear configuraciones, gestionar planes y lanzar streamers desde el dashboard web.
import express from "express";

const router = express.Router();

// Planes disponibles
const PLANES = {
  free: {
    nombre: "Gratis",
    precio: 0,
    periodo: "semana",
    caracteristicas: ["IA con Gemini", "Chat de TikTok", "Overlay 3D básico", "1 stream a la vez"],
    limiteStreams: 1,
    vozPremium: false,
    vision: false,
  },
  pro: {
    nombre: "Pro",
    precio: 9,
    periodo: "semana",
    caracteristicas: [
      "Todo lo de Gratis",
      "Voz ElevenLabs premium",
      "Avatar 3D + expresiones",
      "Mini-juegos en overlay",
      "Efectos de donación",
      "Memoria de usuarios VIP",
    ],
    limiteStreams: 1,
    vozPremium: true,
    vision: false,
  },
  enterprise: {
    nombre: "Emprende",
    precio: 29,
    periodo: "mes",
    caracteristicas: [
      "Todo lo de Pro",
      "Multi-stream (3 cuentas)",
      "Visión con Gemini",
      "Automatización PRISM",
      "Soporte prioritario",
    ],
    limiteStreams: 3,
    vozPremium: true,
    vision: true,
  },
};

// Configuraciones guardadas (en producción iría a base de datos)
const configuraciones = new Map();

// GET /api/studio/planes — listar planes disponibles
router.get("/planes", (_req, res) => {
  res.json({ ok: true, planes: PLANES });
});

// POST /api/studio/config — guardar configuración del streamer
router.post("/config", (req, res) => {
  try {
    const { tiktok, gemini, personality, plan } = req.body;

    if (!tiktok) return res.status(400).json({ error: "tiktok es requerido" });
    if (!gemini) return res.status(400).json({ error: "gemini es requerido" });

    const configId = `stream-${Date.now()}`;
    const planData = PLANES[plan] || PLANES.free;

    // NO guardar la API key en texto plano en producción
    configuraciones.set(configId, {
      id: configId,
      tiktok,
      geminiConfigured: Boolean(gemini),
      personality: personality || "Leviatán supremo",
      plan: plan || "free",
      createdAt: new Date().toISOString(),
      limiteStreams: planData.limiteStreams,
    });

    res.json({
      ok: true,
      configId,
      plan: planData.nombre,
      message: "Configuración guardada. Descarga tu .env y arranca con: python -m leviatan.main",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/studio/launch — lanzar streamer
router.post("/launch", (req, res) => {
  try {
    const { tiktok, gemini, personality, plan } = req.body;

    if (!gemini) {
      return res.status(400).json({
        ok: false,
        error: "Necesitas tu API key de Gemini (gratis en aistudio.google.com/apikey)",
      });
    }

    // En producción: arrancar el proceso Python del Leviatán
    // Por ahora devolvemos las instrucciones
    res.json({
      ok: true,
      message: "Configuración lista",
      instructions: [
        "1. Descarga el archivo .env generado",
        "2. Colócalo en la raíz del proyecto",
        "3. Ejecuta: pip install -r leviatan/requirements.txt",
        "4. Ejecuta: python -m leviatan.main --check",
        "5. Ejecuta: python -m leviatan.main",
      ],
      overlay: "http://localhost:3000/overlay/universe.html",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/studio/roi — calcular ROI estimado
router.get("/roi", (req, res) => {
  const viewers = parseInt(req.query.viewers) || 0;
  const dailyGifts = Math.round(viewers * 0.02 * 0.5);
  const monthly = dailyGifts * 30;
  res.json({
    ok: true,
    estimacion: {
      viewers,
      regalosDiarios: dailyGifts,
      ingresosMensuales: monthly,
      nota: "Estimación basada en conversión promedio de TikTok Live (2% envían regalos, ~$0.50/regalo)",
    },
  });
});

export default router;
