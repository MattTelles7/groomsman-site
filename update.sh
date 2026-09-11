#!/usr/bin/env bash
set -Eeuo pipefail

main() {
  local directory branch origin
  directory="${INSTALL_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)}"
  if [[ "${1:-}" == -h || "${1:-}" == --help ]]; then
    echo "Usage: sudo /opt/groomsman-site/update.sh [--branch main|develop]"
    echo "Without --branch, updates the currently installed branch. Preserves .env."
    exit 0
  fi
  [[ -d "$directory/.git" ]] || { echo "No Git installation at $directory. Run install.sh first." >&2; exit 1; }
  branch="$(git -C "$directory" branch --show-current)"
  origin="$(git -C "$directory" remote get-url origin)"
  exec bash "$directory/install.sh" --install-dir "$directory" --repo "$origin" --branch "$branch" "$@"
}

main "$@"
