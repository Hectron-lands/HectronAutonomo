import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { connect as prismConnect, call as prismCall } from "./prism-controller.mjs";

const app = express();
// PRISM Live Studio (Games & IRL) se controla automatizando su app de escritorio Qt.
const PRISM_WINDOW_TITLE = process.env.PRISM_WINDOW_TITLE || "PRISM Live Studio";

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.AGENT_TOKEN || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

let connected = false;
let lastError = null;
let brainWss = null;