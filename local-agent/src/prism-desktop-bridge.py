#!/usr/bin/env python3
"""Bridge de automatización de escritorio para PRISM Live Studio (app Qt).

Controla la ventana de PRISM Live Studio Desktop usando pywinauto, accediendo
a los widgets por su objectName/automation ID reales (extraídos del código
fuente público github.com/naver/prism-live-studio):
  - Botón Go Live / Finish Live: QPushButton "GoLiveShift"
  - Botón Grabar: QPushButton "Record"
  - Dock de escenas: "scenesDock"
  - Items de escena: QLabel "nameLabel" / "label"

Uso:
    python prism-desktop-bridge.py <action> <json_payload>

Acciones: ping, get_scenes, get_current_scene, set_scene, get_stream_status,
          go_live, finish_live
"""
import json
import sys

try:
    from pywinauto import Desktop, Application
    from pywinauto.findwindows import ElementNotFoundError
except ImportError:
    print(json.dumps({"ok": False, "error": "pywinauto no instalado. Ejecuta: pip install pywinauto"}))
    sys.exit(0)


def find_window(window_title):
    """Conecta a la ventana de PRISM por título aproximado."""
    app = Application(backend="uia").connect(title_re=f".*{window_title}.*", timeout=10)
    return app.top_window()


def action_ping(payload):
    win = find_window(payload["windowTitle"])
    return {"ok": True, "title": win.window_text()}


def action_get_scenes(payload):
    win = find_window(payload["windowTitle"])
    scenes = []
    # Los items de escena exponen su nombre en QLabel "nameLabel" o "label".
    for label in win.descendants(control_type="Text"):
        try:
            name = label.element_info.automation_id
            if name in ("nameLabel", "label", "nameLineEdit"):
                text = label.window_text().strip()
                if text and text not in scenes:
                    scenes.append(text)
        except Exception:
            continue
    return {"ok": True, "scenes": scenes}


def action_get_current_scene(payload):
    win = find_window(payload["windowTitle"])
    # La escena actualmente en programa suele estar seleccionada/marcada.
    for item in win.descendants(control_type="ListItem"):
        try:
            if item.is_selected():
                for label in item.descendants(control_type="Text"):
                    text = label.window_text().strip()
                    if text:
                        return {"ok": True, "scene": text}
        except Exception:
            continue
    return {"ok": True, "scene": ""}


def action_set_scene(payload):
    win = find_window(payload["windowTitle"])
    target = payload["sceneName"]
    # Buscar el item de escena por texto y hacer clic.
    for item in win.descendants(control_type="ListItem"):
        try:
            texts = [t.window_text().strip() for t in item.descendants(control_type="Text")]
            if target in texts:
                item.double_click_input()
                return {"ok": True, "scene": target}
        except Exception:
            continue
    return {"ok": False, "error": f"Escena no encontrada: {target}"}


def action_get_stream_status(payload):
    win = find_window(payload["windowTitle"])
    # El botón GoLiveShift es "checkable": marcado = en vivo.
    try:
        btn = win.child_window(auto_id="GoLiveShift", control_type="Button")
        active = btn.get_toggle_state() == 1
        return {"ok": True, "active": active}
    except ElementNotFoundError:
        return {"ok": True, "active": False}
    except Exception:
        return {"ok": True, "active": False}


def action_go_live(payload):
    win = find_window(payload["windowTitle"])
    try:
        btn = win.child_window(auto_id="GoLiveShift", control_type="Button")
        if btn.get_toggle_state() != 1:
            btn.click_input()
        return {"ok": True}
    except ElementNotFoundError:
        return {"ok": False, "error": "Botón GoLiveShift no encontrado"}


def action_finish_live(payload):
    win = find_window(payload["windowTitle"])
    try:
        btn = win.child_window(auto_id="GoLiveShift", control_type="Button")
        if btn.get_toggle_state() == 1:
            btn.click_input()
        return {"ok": True}
    except ElementNotFoundError:
        return {"ok": False, "error": "Botón GoLiveShift no encontrado"}


ACTIONS = {
    "ping": action_ping,
    "get_scenes": action_get_scenes,
    "get_current_scene": action_get_current_scene,
    "set_scene": action_set_scene,
    "get_stream_status": action_get_stream_status,
    "go_live": action_go_live,
    "finish_live": action_finish_live,
}


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"ok": False, "error": "Uso: python prism-desktop-bridge.py <action> <json_payload>"}))
        return
    action = sys.argv[1]
    try:
        payload = json.loads(sys.argv[2])
    except json.JSONDecodeError as e:
        print(json.dumps({"ok": False, "error": f"Payload JSON inválido: {e}"}))
        return

    handler = ACTIONS.get(action)
    if not handler:
        print(json.dumps({"ok": False, "error": f"Acción desconocida: {action}"}))
        return

    try:
        result = handler(payload)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
