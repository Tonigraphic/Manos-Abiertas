import os
from pathlib import Path

from huggingface_hub import HfApi

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.local"

if ENV_FILE.exists():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"\''))

repo_id = os.getenv("VITE_HF_SUGGESTIONS_REPO") or os.getenv("HF_SUGGESTIONS_REPO")
token = os.getenv("VITE_HF_SUGGESTIONS_TOKEN") or os.getenv("HF_SUGGESTIONS_TOKEN")
folder = ROOT / "public" / "videos_optimized"

if not repo_id or not token:
    raise SystemExit("Faltan VITE_HF_SUGGESTIONS_REPO/HF_SUGGESTIONS_REPO o el token de Hugging Face")
if not folder.exists():
    raise SystemExit(f"No existe la carpeta optimizada: {folder}")

files = sorted(folder.glob("*.mp4"))
if not files:
    raise SystemExit("No hay MP4 optimizados para subir")

print(f"Subiendo {len(files)} videos optimizados a {repo_id}...")
api = HfApi(token=token)
api.upload_folder(
    repo_id=repo_id,
    repo_type="model",
    folder_path=str(folder),
    path_in_repo=".",
    commit_message="Optimizar videos del diccionario para reproducción web",
)
print("Subida completada.")
