#!/usr/bin/env python
import os, sys
from pathlib import Path

def main():
    """Run administrative tasks."""
    # ✅ ensure the repo root (folder that contains 'backend/') is on sys.path
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

    os.environ.setdefault(
        "DJANGO_SETTINGS_MODULE",
        "backend.intelligent_startup_dashboard.settings"
    )
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)

if __name__ == "__main__":
    main()
