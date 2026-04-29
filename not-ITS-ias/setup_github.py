#!/usr/bin/env python3
"""
setup_github.py — Not-ITS-ias
One-shot installer: creates the GitHub repo, uploads all files,
and enables GitHub Pages via the GitHub REST API.

Usage:
    python setup_github.py

Requirements:
    pip install requests

The script will ask for your GitHub personal access token (fine-grained or classic).
Permissions needed:
  - repo (full access) OR
  - Fine-grained: Contents (read+write), Pages (read+write), Actions (read+write)
"""

import os
import sys
import base64
import json
import time
import getpass
import requests

# ============================================================
# CONFIG — edit these if needed
# ============================================================
REPO_NAME        = "not-its-ias"
REPO_DESCRIPTION = "Not-ITS-ias — ITS & Smart Mobility news aggregator PWA"
REPO_PRIVATE     = False   # set True if you want a private repo
DEFAULT_BRANCH   = "main"

# Files to upload (relative to this script's directory)
FILES_TO_UPLOAD = [
    "index.html",
    "styles.css",
    "app.js",
    "sw.js",
    "manifest.json",
    "icon.svg",
    "fetch_news.py",
    "README.md",
    ".github/workflows/update-news.yml",
]

# ============================================================
# API HELPERS
# ============================================================

BASE = "https://api.github.com"

def headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept":        "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

def get_username(token: str) -> str:
    r = requests.get(f"{BASE}/user", headers=headers(token))
    r.raise_for_status()
    return r.json()["login"]

def repo_exists(token: str, owner: str, repo: str) -> bool:
    r = requests.get(f"{BASE}/repos/{owner}/{repo}", headers=headers(token))
    return r.status_code == 200

def create_repo(token: str, name: str, desc: str, private: bool) -> dict:
    payload = {
        "name":        name,
        "description": desc,
        "private":     private,
        "auto_init":   True,      # creates initial commit with README placeholder
        "default_branch": DEFAULT_BRANCH,
    }
    r = requests.post(f"{BASE}/user/repos", headers=headers(token), json=payload)
    r.raise_for_status()
    return r.json()

def get_file_sha(token: str, owner: str, repo: str, path: str) -> str | None:
    r = requests.get(
        f"{BASE}/repos/{owner}/{repo}/contents/{path}",
        headers=headers(token),
    )
    if r.status_code == 200:
        return r.json().get("sha")
    return None

def upload_file(token: str, owner: str, repo: str, path: str, content_bytes: bytes, message: str, sha: str | None = None):
    content_b64 = base64.b64encode(content_bytes).decode()
    payload = {
        "message": message,
        "content": content_b64,
        "branch":  DEFAULT_BRANCH,
    }
    if sha:
        payload["sha"] = sha

    r = requests.put(
        f"{BASE}/repos/{owner}/{repo}/contents/{path}",
        headers=headers(token),
        json=payload,
    )
    r.raise_for_status()
    return r.json()

def enable_pages(token: str, owner: str, repo: str):
    payload = {
        "source": {
            "branch": DEFAULT_BRANCH,
            "path":   "/",
        }
    }
    r = requests.post(
        f"{BASE}/repos/{owner}/{repo}/pages",
        headers=headers(token),
        json=payload,
    )
    # 201 = created, 409 = already enabled — both OK
    if r.status_code not in (201, 409, 422):
        r.raise_for_status()
    return r.json() if r.content else {}

def get_pages_url(token: str, owner: str, repo: str) -> str:
    r = requests.get(f"{BASE}/repos/{owner}/{repo}/pages", headers=headers(token))
    if r.status_code == 200:
        return r.json().get("html_url", "")
    return f"https://{owner}.github.io/{repo}/"

# ============================================================
# PLACEHOLDER news.json
# ============================================================

EMPTY_NEWS = {
    "version":    "1.0",
    "updated_at": "2000-01-01T00:00:00Z",
    "stats":      {"total": 0, "by_category": {}, "by_source": {}},
    "categories": {
        "destacadas":      [],
        "trafico":         [],
        "smartcities":     [],
        "movilidad":       [],
        "autonomos":       [],
        "infraestructura": [],
        "industria":       [],
        "regulacion":      [],
    }
}

# ============================================================
# MAIN
# ============================================================

def main():
    print()
    print("╔══════════════════════════════════════════════════╗")
    print("║     Not-ITS-ias — GitHub Setup Script           ║")
    print("╚══════════════════════════════════════════════════╝")
    print()

    # --- Token ---
    print("Necesitás un GitHub Personal Access Token con permisos:")
    print("  · Contents: read + write")
    print("  · Pages:    read + write")
    print("  · Actions:  read + write")
    print()
    print("Creá uno en: https://github.com/settings/tokens/new")
    print()
    token = getpass.getpass("Pegá tu token (no se muestra): ").strip()
    if not token:
        print("✗ Token vacío. Saliendo.")
        sys.exit(1)

    # --- Validate token ---
    print()
    print("→ Validando token...")
    try:
        username = get_username(token)
        print(f"  ✓ Autenticado como: {username}")
    except Exception as e:
        print(f"  ✗ Token inválido o sin permisos: {e}")
        sys.exit(1)

    # --- Create or reuse repo ---
    print()
    print(f"→ Verificando repositorio '{REPO_NAME}'...")
    exists = repo_exists(token, username, REPO_NAME)

    if exists:
        print(f"  ℹ Repo ya existe — los archivos se actualizarán")
    else:
        print(f"  + Creando repositorio '{REPO_NAME}'...")
        try:
            repo_data = create_repo(token, REPO_NAME, REPO_DESCRIPTION, REPO_PRIVATE)
            print(f"  ✓ Repo creado: {repo_data['html_url']}")
            print("  ⏳ Esperando que GitHub inicialice el repo...")
            time.sleep(3)
        except Exception as e:
            print(f"  ✗ Error creando repo: {e}")
            sys.exit(1)

    # --- Upload files ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print()
    print("→ Subiendo archivos...")

    # Collect files
    all_files = list(FILES_TO_UPLOAD)
    # Also add an initial empty news.json
    all_files.append("news.json")

    for file_path in all_files:
        if file_path == "news.json":
            content_bytes = json.dumps(EMPTY_NEWS, indent=2, ensure_ascii=False).encode("utf-8")
            local_exists  = True
        else:
            local_path = os.path.join(script_dir, file_path)
            if not os.path.exists(local_path):
                print(f"  ⚠ Archivo no encontrado, omitiendo: {file_path}")
                continue
            with open(local_path, "rb") as f:
                content_bytes = f.read()
            local_exists = True

        try:
            sha = get_file_sha(token, username, REPO_NAME, file_path)
            upload_file(
                token, username, REPO_NAME,
                path=file_path,
                content_bytes=content_bytes,
                message=f"chore: add {file_path}",
                sha=sha,
            )
            print(f"  ✓ {file_path}")
        except Exception as e:
            print(f"  ✗ Error subiendo {file_path}: {e}")

    # --- Enable Pages ---
    print()
    print("→ Habilitando GitHub Pages...")
    try:
        enable_pages(token, username, REPO_NAME)
        time.sleep(2)
        pages_url = get_pages_url(token, username, REPO_NAME)
        print(f"  ✓ GitHub Pages habilitado")
        print(f"  🌐 URL: {pages_url}")
    except Exception as e:
        print(f"  ⚠ No se pudo habilitar Pages automáticamente: {e}")
        print(f"  → Habilitalo manualmente: Settings → Pages → Branch: {DEFAULT_BRANCH} → /")

    # --- Done ---
    print()
    print("╔══════════════════════════════════════════════════╗")
    print("║  ✅  Setup completado                            ║")
    print("╚══════════════════════════════════════════════════╝")
    print()
    print(f"  Repo:  https://github.com/{username}/{REPO_NAME}")
    print(f"  App:   https://{username}.github.io/{REPO_NAME}/")
    print()
    print("  Próximos pasos:")
    print("  1. Esperá ~2 min para que GitHub Pages active")
    print("  2. El primer fetch de noticias correrá automáticamente")
    print("     según el cron del workflow (06:00, 13:00, 19:00 UTC)")
    print("  3. Para forzarlo ahora: Actions → Update News → Run workflow")
    print()


if __name__ == "__main__":
    main()
