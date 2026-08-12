#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NPM="$(command -v npm)"
mkdir -p "$HOME/.config/systemd/user"

cat > "$HOME/.config/systemd/user/hectron-agent.service" <<EOF
[Unit]
Description=HECTRON Local OBS Agent
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$ROOT
ExecStart=$NPM run agent
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now hectron-agent.service
echo "✅ HECTRON Agent instalado como servicio de usuario."