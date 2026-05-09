"""ASGI entrypoint for platforms expecting `main:app`."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from server import app  # noqa: E402,F401
