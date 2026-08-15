import { BigQuery } from '@google-cloud/bigquery';

/**
 * Cliente de BigQuery para HECTRON Autónomo
 * Almacena logs de chat, estado de psique y decisiones autónomas
 */
class BigQueryClient {
  constructor() {
    this.bigquery = new BigQuery({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: process.env.GCP_CREDENTIALS_JSON 
        ? JSON.parse(process.env.GCP_CREDENTIALS_JSON)
        : undefined,
    });
    this.datasetId = 'hectron_autonomo';
  }

  /**
   * Guardar log de chat en BigQuery
   */
  async saveChatLog(logData) {
    try {
      const tableId = `${this.datasetId}.chat_logs`;
      const rows = [{
        id: logData.id || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user_id: logData.userId || 'anonymous',
        user_name: logData.userName || 'Anonymous',
        message: logData.message || '',
        emotion: logData.emotion || 'neutral',
        scene: logData.scene || 'DEFAULT',
        response: logData.response || '',
        response_emotion: logData.responseEmotion || 'neutral',
        tokens_used: logData.tokensUsed || 0,
        processing_time_ms: logData.processingTimeMs || 0,
      }];

      await this.bigquery.dataset(this.datasetId).table(tableId).insert(rows);
      console.log('📊 Chat log guardado en BigQuery');
    } catch (error) {
      console.error('❌ Error guardando chat log en BigQuery:', error.message);
    }
  }

  /**
   * Guardar estado de la psique (Ω) en BigQuery
   */
  async savePsycheState(state) {
    try {
      const tableId = `${this.datasetId}.psyche_state`;
      const rows = [{
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        machiavellianism: state.machiavellianism || 0,
        stoicism: state.stoicism || 0,
        emotional_weight: state.emotionalWeight || 0,
        creative_drive: state.creativeDrive || 0,
        analytical_depth: state.analyticalDepth || 0,
        dominant_trait: state.dominantTrait || 'neutral',
        session_id: state.sessionId || crypto.randomUUID(),
      }];

      await this.bigquery.dataset(this.datasetId).table(tableId).insert(rows);
      console.log('🧠 Estado de psique guardado en BigQuery');
    } catch (error) {
      console.error('❌ Error guardando estado de psique:', error.message);
    }
  }

  /**
   * Guardar decisión autónoma en BigQuery
   */
  async saveAutonomousDecision(decision) {
    try {
      const tableId = `${this.datasetId}.autonomous_decisions`;
      const rows = [{
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        decision_type: decision.type,
        decision_value: JSON.stringify(decision.value),
        context: decision.context || '',
        confidence: decision.confidence || 0.8,
        execution_time_ms: decision.executionTimeMs || 0,
        success: decision.success !== false,
      }];

      await this.bigquery.dataset(this.datasetId).table(tableId).insert(rows);
      console.log('🤖 Decisión autónoma guardada en BigQuery');
    } catch (error) {
      console.error('❌ Error guardando decisión autónoma:', error.message);
    }
  }

  /**
   * Guardar métricas de usuario
   */
  async saveUserMetrics(metrics) {
    try {
      const tableId = `${this.datasetId}.user_metrics`;
      const rows = [{
        user_id: metrics.userId,
        date: new Date().toISOString().split('T')[0],
        messages_sent: metrics.messagesSent || 0,
        autonomous_interactions: metrics.autonomousInteractions || 0,
        avg_response_time_ms: metrics.avgResponseTimeMs || 0,
        favorite_emotion: metrics.favoriteEmotion || 'neutral',
        engagement_score: metrics.engagementScore || 0,
        last_seen: new Date().toISOString(),
      }];

      await this.bigquery.dataset(this.datasetId).table(tableId).insert(rows);
    } catch (error) {
      console.error('❌ Error guardando métricas de usuario:', error.message);
    }
  }

  /**
   * Obtener métricas de autonomía
   */
  async getAutonomyMetrics(days = 7) {
    try {
      const query = `
        SELECT
          DATE(timestamp) as date,
          COUNT(*) as autonomous_actions,
          AVG(confidence) as avg_confidence,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_actions,
          AVG(execution_time_ms) as avg_execution_time
        FROM ${"`" + this.datasetId + ".autonomous_decisions`"}
        WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)
        GROUP BY date
        ORDER BY date DESC
      `;

      const [rows] = await this.bigquery.query(query);
      return rows;
    } catch (error) {
      console.error('❌ Error obteniendo métricas de autonomía:', error.message);
      return [];
    }
  }

  /**
   * Obtener métricas de chat
   */
  async getChatMetrics(days = 7) {
    try {
      const query = `
        SELECT
          DATE(timestamp) as date,
          COUNT(*) as messages,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(tokens_used) as avg_tokens,
          AVG(processing_time_ms) as avg_processing_time,
          MODE(emotion) as most_common_emotion
        FROM ${"`" + this.datasetId + ".chat_logs`"}
        WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)
        GROUP BY date
        ORDER BY date DESC
      `;

      const [rows] = await this.bigquery.query(query);
      return rows;
    } catch (error) {
      console.error('❌ Error obteniendo métricas de chat:', error.message);
      return [];
    }
  }

  /**
   * Obtener métricas de psique
   */
  async getPsycheMetrics(days = 7) {
    try {
      const query = `
        SELECT
          DATE(timestamp) as date,
          AVG(machiavellianism) as avg_machiavellianism,
          AVG(stoicism) as avg_stoicism,
          AVG(emotional_weight) as avg_emotional_weight,
          AVG(creative_drive) as avg_creative_drive,
          AVG(analytical_depth) as avg_analytical_depth,
          MODE(dominant_trait) as most_common_trait
        FROM ${"`" + this.datasetId + ".psyche_state`"}
        WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)
        GROUP BY date
        ORDER BY date DESC
      `;

      const [rows] = await this.bigquery.query(query);
      return rows;
    } catch (error) {
      console.error('❌ Error obteniendo métricas de psique:', error.message);
      return [];
    }
  }

  /**
   * Obtener todas las métricas
   */
  async getAllMetrics(days = 7) {
    const [chatMetrics, psycheMetrics, autonomyMetrics] = await Promise.all([
      this.getChatMetrics(days),
      this.getPsycheMetrics(days),
      this.getAutonomyMetrics(days),
    ]);

    return {
      chatMetrics,
      psycheMetrics,
      autonomyMetrics,
      autonomyRate: this.calculateAutonomyRate(autonomyMetrics),
      totalMessages: chatMetrics.reduce((sum, m) => sum + m.messages, 0),
      totalAutonomousActions: autonomyMetrics.reduce((sum, m) => sum + m.autonomous_actions, 0),
    };
  }

  /**
   * Calcular tasa de autonomía
   */
  calculateAutonomyRate(autonomyMetrics) {
    if (!autonomyMetrics || autonomyMetrics.length === 0) return 0;
    const total = autonomyMetrics.reduce((sum, m) => sum + m.autonomous_actions, 0);
    return total / autonomyMetrics.length;
  }

  /**
   * Crear el dataset y tablas si no existen
   */
  async initialize() {
    if (this.useLocal) {
      await this.local.initialize();
      return;
    }
    try {
      // Verificar si el dataset existe
      const [datasets] = await this.bigquery.getDatasets();
      const datasetExists = datasets.some(d => d.id === this.datasetId);

      if (!datasetExists) {
        console.log('📦 Creando dataset hectron_autonomo...');
        await this.bigquery.createDataset(this.datasetId, {
          location: 'US',
          description: 'Dataset para HECTRON Autónomo - TikTok LIVE Streaming',
        });
      }

      // Crear tablas
      const tables = [
        {
          name: 'chat_logs',
          schema: [
            { name: 'id', type: 'STRING' },
            { name: 'timestamp', type: 'TIMESTAMP' },
            { name: 'user_id', type: 'STRING' },
            { name: 'user_name', type: 'STRING' },
            { name: 'message', type: 'TEXT' },
            { name: 'emotion', type: 'STRING' },
            { name: 'scene', type: 'STRING' },
            { name: 'response', type: 'TEXT' },
            { name: 'response_emotion', type: 'STRING' },
            { name: 'tokens_used', type: 'INT64' },
            { name: 'processing_time_ms', type: 'INT64' },
          ],
          partitionBy: 'DATE(timestamp)',
          clusterBy: ['user_id', 'scene'],
        },
        {
          name: 'psyche_state',
          schema: [
            { name: 'id', type: 'STRING' },
            { name: 'timestamp', type: 'TIMESTAMP' },
            { name: 'machiavellianism', type: 'FLOAT64' },
            { name: 'stoicism', type: 'FLOAT64' },
            { name: 'emotional_weight', type: 'FLOAT64' },
            { name: 'creative_drive', type: 'FLOAT64' },
            { name: 'analytical_depth', type: 'FLOAT64' },
            { name: 'dominant_trait', type: 'STRING' },
            { name: 'session_id', type: 'STRING' },
          ],
          partitionBy: 'DATE(timestamp)',
        },
        {
          name: 'autonomous_decisions',
          schema: [
            { name: 'id', type: 'STRING' },
            { name: 'timestamp', type: 'TIMESTAMP' },
            { name: 'decision_type', type: 'STRING' },
            { name: 'decision_value', type: 'TEXT' },
            { name: 'context', type: 'TEXT' },
            { name: 'confidence', type: 'FLOAT64' },
            { name: 'execution_time_ms', type: 'INT64' },
            { name: 'success', type: 'BOOLEAN' },
          ],
          partitionBy: 'DATE(timestamp)',
        },
        {
          name: 'user_metrics',
          schema: [
            { name: 'user_id', type: 'STRING' },
            { name: 'date', type: 'DATE' },
            { name: 'messages_sent', type: 'INT64' },
            { name: 'autonomous_interactions', type: 'INT64' },
            { name: 'avg_response_time_ms', type: 'FLOAT64' },
            { name: 'favorite_emotion', type: 'STRING' },
            { name: 'engagement_score', type: 'FLOAT64' },
            { name: 'last_seen', type: 'TIMESTAMP' },
          ],
          partitionBy: 'date',
        },
      ];

      for (const table of tables) {
        const tableRef = this.bigquery.dataset(this.datasetId).table(table.name);
        const [exists] = await tableRef.exists();
        
        if (!exists) {
          console.log(`📋 Creando tabla ${table.name}...`);
          await this.bigquery.dataset(this.datasetId).createTable(table.name, {
            schema: table.schema,
            location: 'US',
          });

          // Añadir particionamiento
          if (table.partitionBy) {
            const field = table.partitionBy.replace('DATE(', '').replace(')', '');
            await tableRef.setMetadata({
              timePartitioning: { type: 'DAY', field },
            });
          }

          // Añadir clustering
          if (table.clusterBy) {
            await tableRef.setMetadata({
              clustering: { fields: table.clusterBy },
            });
          }
        }
      }

      console.log('✅ Inicialización de BigQuery completada');
    } catch (error) {
      console.error('❌ Error en inicialización de BigQuery:', error.message);
    }
  }
}

export const bigqueryClient = new BigQueryClient();

// Inicializar al importar
bigqueryClient.initialize().catch(() => {});