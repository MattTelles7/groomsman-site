# Debian VM deployment

## Layout

```text
Browser → Cloudflare HTTPS → VM port 3000 → Docker / Nginx port 8080
```

The Node build happens inside Docker. The running site is static, so no Node,
database, environment secrets, or migrations are required at runtime.

| Setting | Default |
| --- | --- |
| Installation | `/opt/groomsman-site` |
| Compose project | `groomsman-site` |
| Service / local image | `app` / `groomsman-site:local` |
| Host listener | `0.0.0.0:3000` |
| Container listener | `8080` |
| Health endpoint | `/healthz` |
| Restart policy | `unless-stopped` |

`install.sh` installs Docker from its [official Debian/Ubuntu apt repository](https://docs.docker.com/engine/install/debian/).
It does not replace conflicting old Docker packages automatically. A clean VM
is the easiest starting point; follow Docker’s conflict-removal steps if the VM
already has a different Docker installation.

## Install and update

Use the one-liners in the README. Options are:

```bash
sudo bash install.sh --branch develop
sudo bash install.sh --branch main --install-dir /opt/groomsman-site
sudo bash install.sh --branch develop --repo https://github.com/MattTelles7/groomsman-site.git
```

`INSTALL_DIR` and `REPO_URL` environment variables are also supported. The
installer only accepts `main` or `develop`; push/merge a feature to the desired
branch before deployment. `main` is selected deliberately, never merged by the
installer.

The installer refuses local edits, untracked files, ahead/diverged branches,
tracked `.env` files, unexpected remotes, and non-Git directories at the target
path. It locks concurrent installs, preserves `.env`, builds before replacing
the container, waits for Compose health, and verifies the running image ID.
There is a short interruption while the container is replaced. This is not a
zero-downtime rollout and there is no automatic rollback after startup failure.

## Private repository bootstrap

The raw URL works only when GitHub permits anonymous access. For a private repo,
use a read-only SSH deploy key configured for **root on the VM** (because the
installer runs as root). Add GitHub to root’s known hosts after verifying its
[published host fingerprints](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints).
Then bootstrap through Git:

```bash
sudo git clone --branch develop git@github.com:MattTelles7/groomsman-site.git /opt/groomsman-site
sudo bash /opt/groomsman-site/install.sh --branch develop --repo git@github.com:MattTelles7/groomsman-site.git
```

This needs Git installed first. Later, the same `sudo /opt/groomsman-site/update.sh`
command automatically reuses the saved SSH origin. Do not put a token in the
tracked scripts or repository URL.

## Cloudflare

### Tunnel running directly on the VM

1. Install and run `cloudflared` on the VM using the command provided by your
   Cloudflare dashboard.
2. Create a published application route for your chosen hostname.
3. Set the service to `http://localhost:3000` (or your chosen `APP_PORT`).
4. Open the public HTTPS URL and try address copying.

This follows [Cloudflare’s tunnel setup](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/).
No router port-forward is needed for this tunnel arrangement. The installer
does not create or modify a Cloudflare tunnel, DNS, or credentials.

If `cloudflared` is on another machine, target `http://VM_LAN_IP:3000` and retain
`BIND_ADDRESS=0.0.0.0`. If it runs in a separate Docker container, `localhost`
means that container, not this VM; use a shared Docker network and `http://app:8080`,
or another reachable VM address.

### Existing reverse proxy / Cloudflare DNS

Point your existing reverse proxy at the VM’s port 3000 and configure origin
TLS as appropriate for that proxy. Cloudflare DNS by itself does not publish a
private VM or route HTTPS to port 3000. The normal public URL should use HTTPS
without `:3000`; the built-in container is an HTTP origin, not a TLS terminator.

### Caching

Nginx sends `Cache-Control: no-store` for HTML and `theme.js`. Fingerprinted
`/assets/` files can be cached for a year. Avoid a Cloudflare “Cache Everything”
rule that overrides the HTML policy. There is no service worker. Refresh a page
after a schedule update; already-open tabs retain the old loaded schedule.

### VM settings

Edit `/opt/groomsman-site/.env`:

```dotenv
APP_PORT=3000
BIND_ADDRESS=0.0.0.0
```

For a tunnel running directly on the VM, you may use `BIND_ADDRESS=127.0.0.1`
to restrict the origin to the VM itself. Then reapply the Compose settings:

```bash
cd /opt/groomsman-site
sudo docker compose up -d --wait
```

Change the tunnel service port too if `APP_PORT` changes. The health check runs
inside the new container, so it remains correct for a custom host port.

## Troubleshooting

```bash
cd /opt/groomsman-site
sudo docker compose ps
sudo docker compose logs --tail=80 app
sudo docker compose config --quiet
sudo docker compose exec app nginx -t
curl --fail http://localhost:3000/healthz
curl -I http://localhost:3000/
sudo systemctl is-enabled docker
sudo systemctl is-active docker
```

- **Raw GitHub returns 404:** branch/files are not pushed, or the repository is private.
- **Dirty checkout:** save the edits in Git or move the specific untracked file.
  The installer intentionally does not stash, reset, or delete them.
- **Port already allocated:** another app may use 3000 (including Mark’s site).
  Change `APP_PORT` in `.env`, then reapply and update the tunnel origin.
- **Clipboard opens a dialog:** plain HTTP on a LAN address or browser permission
  restrictions can prevent automatic copying. The manual selection fallback is
  expected; try the public HTTPS URL for one-tap copying.
- **Stale schedule:** reload the page and check Cloudflare cache overrides.
- **Build failed:** old container still runs. Fix the source, push, and rerun.
- **Container unhealthy:** inspect logs, fix/revert the bad commit on your source
  branch, push, and rerun the installer. Reverting with a new commit keeps the
  updater’s fast-forward rule intact.

For a reboot check, run `sudo reboot`, reconnect, and check `docker compose ps`
and `/healthz`. The enabled Docker service and `unless-stopped` restart policy
bring the app back after reboot, unless it was manually stopped beforehand.

## Verification status

Local checks cover TypeScript, production builds, schedule boundaries, and real
disposable Git checkouts exercising repeated updates, branch switching, `.env`
preservation, and refusal of dirty/diverged/unexpected repositories. Bash syntax
and ShellCheck pass locally. These tests do not install system packages.
The GitHub workflow includes Linux ShellCheck and a real Docker build/start/health
test. The Debian bootstrap still needs its first run on your VM; no VM or public
Cloudflare domain was available during implementation.
