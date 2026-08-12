import "dotenv/config";
import express from "express";
import cors from "cors";
import OBSWebSocket from "obs-websocket-js";
import { WebSocketServer } from "ws";

const app = express();
const obs = new OBSWebSocket();

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.AGENT_TOKEN || "";
const OBS_HOST = process.env.OBS_HOST || "127.0.0.1";
const OBS_PORT = Number(process.env.OBS_PORT || 4455);
const OBS_PASSWORD = process.env.OBS_PASSWORD || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

let connected = false;
let lastError = null;
let brainWss = null;