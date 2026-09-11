#!/usr/bin/env bash
set -Eeuo pipefail

# Kept self-contained so the raw GitHub one-liner can bootstrap a fresh Debian VM.
# The whole installer is parsed before main runs, making self-updates safe.
INSTALL_DIR="${INSTALL_DIR:-/opt/groomsman-site}"
REPO_URL="${REPO_URL:-https://github.com/MattTelles7/groomsman-site.git}"
BRANCH="main"

usage() {
  cat <<'EOF'
Usage: install.sh [--branch main|develop] [--repo URL] [--install-dir PATH]

Install or update the groomsmen site on Debian/Ubuntu. The same command handles
system packages, Docker, Git, configuration, build, restart, and health checks.
Defaults: main, /opt/groomsman-site, MattTelles7/groomsman-site.
EOF
}

update_existing_checkout() {
  local actual_origin changes
  actual_origin="$(git -C "$INSTALL_DIR" remote get-url origin)"
  [[ "$actual_origin" == "$REPO_URL" ]] || { echo "Repository differs from the configured origin. Pass --repo with its exact URL." >&2; exit 1; }
  changes="$(git -C "$INSTALL_DIR" status --porcelain --untracked-files=all)"
  [[ -z "$changes" ]] || { echo "Checkout has local changes. Commit or move them before updating; no files were overwritten." >&2; exit 1; }
  git -C "$INSTALL_DIR" fetch --no-tags origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
  if [[ -n "$(git -C "$INSTALL_DIR" ls-tree -r --name-only "origin/$BRANCH" -- .env)" ]]; then
    echo "Refusing a branch that tracks .env." >&2; exit 1
  fi
  if git -C "$INSTALL_DIR" show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git -C "$INSTALL_DIR" merge-base --is-ancestor "$BRANCH" "origin/$BRANCH" || { echo "Local branch is ahead or diverged. Resolve it before deploying." >&2; exit 1; }
    git -C "$INSTALL_DIR" checkout "$BRANCH"
    git -C "$INSTALL_DIR" merge --ff-only "origin/$BRANCH"
  else
    git -C "$INSTALL_DIR" checkout --track -b "$BRANCH" "origin/$BRANCH"
  fi
}

main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --branch|--repo|--install-dir)
        [[ $# -ge 2 && -n "$2" ]] || { echo "$1 requires a value." >&2; exit 2; }
        case "$1" in
          --branch) BRANCH="$2" ;;
          --repo) REPO_URL="$2" ;;
          --install-dir) INSTALL_DIR="$2" ;;
        esac
        shift 2 ;;
      -h|--help) usage; exit 0 ;;
      *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
    esac
  done
  [[ "$BRANCH" == main || "$BRANCH" == develop ]] || { echo "Branch must be main or develop." >&2; exit 2; }
  INSTALL_DIR="${INSTALL_DIR%/}"
  [[ "$INSTALL_DIR" == /* && "$INSTALL_DIR" != / && -n "$INSTALL_DIR" && ! -L "$INSTALL_DIR" ]] || { echo "Use an absolute, non-root, non-symlink install directory." >&2; exit 2; }
  [[ "$REPO_URL" != -* ]] || { echo "Invalid repository URL." >&2; exit 2; }
  if [[ "$EUID" != 0 ]]; then
    echo "Run the installer as root (sudo bash install.sh), as in the README." >&2
    exit 1
  fi
  [[ -r /etc/os-release ]] || { echo "This installer needs Debian or Ubuntu." >&2; exit 1; }
  # shellcheck source=/dev/null
  . /etc/os-release
  [[ "${ID:-}" == debian || "${ID:-}" == ubuntu ]] || { echo "This installer supports Debian and Ubuntu." >&2; exit 1; }

  if ! command -v git >/dev/null || ! command -v curl >/dev/null || ! command -v gpg >/dev/null || ! command -v flock >/dev/null; then
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git gnupg util-linux
  fi
  if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL "https://download.docker.com/linux/${ID}/gpg" -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/%s %s stable\n' \
      "$(dpkg --print-architecture)" "$ID" "$VERSION_CODENAME" > /etc/apt/sources.list.d/docker.list
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi
  systemctl enable --now docker
  docker compose version >/dev/null

  # Keep simultaneous updates from racing each other.
  exec 9>/var/lock/groomsman-site-install.lock
  flock -n 9 || { echo "Another groomsman-site installation is running." >&2; exit 1; }

  if [[ -d "$INSTALL_DIR/.git" ]]; then
    update_existing_checkout
  elif [[ -e "$INSTALL_DIR" ]]; then
    echo "$INSTALL_DIR already exists and is not this Git installation. Choose another --install-dir; nothing was overwritten." >&2
    exit 1
  else
    local clone_dir
    mkdir -p "$(dirname "$INSTALL_DIR")"
    clone_dir="$(mktemp -d "${INSTALL_DIR}.clone.XXXXXX")"
    if ! git clone --single-branch --branch "$BRANCH" "$REPO_URL" "$clone_dir/repo"; then
      rmdir "$clone_dir" 2>/dev/null || true
      echo "Clone failed. For a private repository, configure root’s Git credentials first; see docs/DEPLOYMENT.md." >&2
      exit 1
    fi
    if [[ -n "$(git -C "$clone_dir/repo" ls-tree -r --name-only HEAD -- .env)" ]]; then
      echo "Refusing a branch that tracks .env. Clone left at $clone_dir for inspection." >&2; exit 1
    fi
    mv "$clone_dir/repo" "$INSTALL_DIR"
    rmdir "$clone_dir"
  fi

  [[ "$(git -C "$INSTALL_DIR" rev-parse HEAD)" == "$(git -C "$INSTALL_DIR" rev-parse "origin/$BRANCH")" ]] || { echo "Checkout does not match origin/$BRANCH." >&2; exit 1; }
  [[ -f "$INSTALL_DIR/.env.example" && -f "$INSTALL_DIR/scripts/deploy.sh" ]] || { echo "Branch does not contain the deployment files. Push/merge the website first." >&2; exit 1; }
  if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    install -m 600 "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
  fi
  chmod 600 "$INSTALL_DIR/.env"
  bash "$INSTALL_DIR/scripts/deploy.sh"
  printf '\nInstalled branch: %s\nInstalled commit: %s\nPreserved configuration: %s/.env\n' \
    "$BRANCH" "$(git -C "$INSTALL_DIR" rev-parse --short=12 HEAD)" "$INSTALL_DIR"
}

if [[ "${BASH_SOURCE[0]:-$0}" == "$0" ]]; then
  main "$@"
fi
