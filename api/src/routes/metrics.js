import express from 'express';
import { bigqueryClient } from '../../../local-agent/src/bigquery-client.mjs';

const router = express.Router();

/**
 * Rutas para métricas y analítica de HECTRON Autónomo
 */

// Obtener todas las métricas
router.get('/all', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const metrics = await bigqueryClient.getAllMetrics(days);
    
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      daysAnalyzed: days,
      ...metrics,
    });
  } catch (error) {
    console.error('❌ Error en /metrics/all:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Obtener métricas de chat
router.get('/chat', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const metrics = await bigqueryClient.getChatMetrics(days);
    
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      daysAnalyzed: days,
      metrics,
    });
  } catch (error) {
    console.error('❌ Error en /metrics/chat:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Obtener métricas de psique (Ω)
router.get('/psyche', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const metrics = await bigqueryClient.getPsycheMetrics(days);
    
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      daysAnalyzed: days,
      metrics,
    });
  } catch (error) {
    console.error('❌ Error en /metrics/psyche:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Obtener métricas de autonomía
router.get('/autonomy', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const metrics = await bigqueryClient.getAutonomyMetrics(days);
    
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      daysAnalyzed: days,
      metrics,
      autonomyRate: bigqueryClient.calculateAutonomyRate(metrics),
    });
  } catch (error) {
    console.error('❌ Error en /metrics/autonomy:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Obtener resumen diario
router.get('/summary', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const [chatMetrics, psycheMetrics, autonomyMetrics] = await Promise.all([
      bigqueryClient.getChatMetrics(days),
      bigqueryClient.getPsycheMetrics(days),
      bigqueryClient.getAutonomyMetrics(days),
    ]);

    // Calcular resumen
    const summary = {
      totalMessages: chatMetrics.reduce((sum, m) => sum + m.messages, 0),
      totalUsers: new Set(chatMetrics.flatMap(m => m.unique_users || [])).size,
      avgTokensPerMessage: chatMetrics.reduce((sum, m) => sum + (m.avg_tokens || 0), 0) / chatMetrics.length,
      avgProcessingTime: chatMetrics.reduce((sum, m) => sum + (m.avg_processing_time || 0), 0) / chatMetrics.length,
      mostCommonEmotion: chatMetrics[0]?.most_common_emotion || 'neutral',
      
      // Métricas de psique
      avgMachiavellianism: psycheMetrics.reduce((sum, m) => sum + (m.avg_machiavellianism || 0), 0) / psycheMetrics.length,
      avgStoicism: psycheMetrics.reduce((sum, m) => sum + (m.avg_stoicism || 0), 0) / psycheMetrics.length,
      avgEmotionalWeight: psycheMetrics.reduce((sum, m) => sum + (m.avg_emotional_weight || 0), 0) / psycheMetrics.length,
      avgCreativeDrive: psycheMetrics.reduce((sum, m) => sum + (m.avg_creative_drive || 0), 0) / psycheMetrics.length,
      avgAnalyticalDepth: psycheMetrics.reduce((sum, m) => sum + (m.avg_analytical_depth || 0), 0) / psycheMetrics.length,
      dominantTrait: psycheMetrics[0]?.most_common_trait || 'neutral',
      
      // Métricas de autonomía
      totalAutonomousActions: autonomyMetrics.reduce((sum, m) => sum + m.autonomous_actions, 0),
      avgConfidence: autonomyMetrics.reduce((sum, m) => sum + (m.avg_confidence || 0), 0) / autonomyMetrics.length,
      autonomyRate: bigqueryClient.calculateAutonomyRate(autonomyMetrics),
    };

    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      daysAnalyzed: days,
      summary,
      rawData: {
        chatMetrics,
        psycheMetrics,
        autonomyMetrics,
      },
    });
  } catch (error) {
    console.error('❌ Error en /metrics/summary:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Obtener datos para dashboard (formato optimizado)
router.get('/dashboard', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const metrics = await bigqueryClient.getAllMetrics(days);

    // Formatear para dashboard
    const dashboardData = {
      // Gráfico de mensajes por día
      messagesByDay: metrics.chatMetrics.map(m => ({
        date: m.date,
        messages: m.messages,
        users: m.unique_users,
      })),
      
      // Gráfico de emociones
      emotionsByDay: metrics.chatMetrics.map(m => ({
        date: m.date,
        emotion: m.most_common_emotion,
      })),
      
      // Gráfico de rasgos de psique
      psycheTraits: metrics.psycheMetrics.map(m => ({
        date: m.date,
        machiavellianism: m.avg_machiavellianism,
        stoicism: m.avg_stoicism,
        emotionalWeight: m.avg_emotional_weight,
        creativeDrive: m.avg_creative_drive,
        analyticalDepth: m.avg_analytical_depth,
      })),
      
      // Gráfico de acciones autónomas
      autonomyActions: metrics.autonomyMetrics.map(m => ({
        date: m.date,
        actions: m.autonomous_actions,
        confidence: m.avg_confidence,
        successful: m.successful_actions,
      })),
      
      // Resumen
      summary: {
        totalMessages: metrics.totalMessages,
        totalAutonomousActions: metrics.totalAutonomousActions,
        autonomyRate: metrics.autonomyRate,
        dominantTrait: metrics.psycheMetrics[0]?.most_common_trait || 'neutral',
      },
    };

    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      daysAnalyzed: days,
      data: dashboardData,
    });
  } catch (error) {
    console.error('❌ Error en /metrics/dashboard:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Exportar router
export default router;