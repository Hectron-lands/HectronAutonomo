// Adaptador serverless para Vercel.
// Vercel requiere exportar una función handler (req, res) por defecto.
// Este archivo envuelve la app Express para que funcione en serverless.

import app from "./index.js";

export default function handler(req, res) {
  // Delegar la petición a la app Express
  return app(req, res);
}
