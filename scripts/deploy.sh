#!/usr/bin/env bash
set -Eeuo pipefail

main() {
  local directory container_id actual_image expected_image published_port
  directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
  cd "$directory"
  export VCS_REF
  VCS_REF="$(git rev-parse HEAD)"
  docker compose config --quiet
  echo "Building the site. The running container stays up during the build..."
  docker compose build --pull app
  echo "Starting the new build and waiting for its health check..."
  if ! docker compose up -d --no-build --wait --wait-timeout 60 app; then
    docker compose ps >&2
    docker compose logs --tail=60 app >&2
    echo "Deployment did not become healthy. See the logs above." >&2
    exit 1
  fi
  container_id="$(docker compose ps -q app)"
  actual_image="$(docker inspect --format '{{.Image}}' "$container_id")"
  expected_image="$(docker image inspect groomsman-site:local --format '{{.Id}}')"
  [[ "$actual_image" == "$expected_image" ]] || { echo "Running container is not the image just built." >&2; exit 1; }
  [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container_id")" == healthy ]] || { echo "New container is not healthy." >&2; exit 1; }
  published_port="$(docker compose port app 8080)"
  printf '\nSite is healthy. Published listener: %s\n' "$published_port"
  echo "Cloudflare Tunnel on this VM: use http://localhost:<APP_PORT> (default 3000)."
}

main "$@"
