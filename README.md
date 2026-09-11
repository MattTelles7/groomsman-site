# The Groom’s Crew

Chris’s groomsmen field guide for **September 24 & 26, 2026**. A responsive,
animated schedule with pastel cards, an Eastern-time wedding countdown, and
one-tap address copying. Runs on one Debian or Ubuntu VM using Docker Compose.

The deployment flow follows the **Mark-wedding-site** repository: `main` for
releases, `develop` for VM testing, and repeatable install/update commands.

## Start locally

Use Node.js 24 LTS (minimum 22.12):

```bash
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). No `.env` or database is needed for
local development. Fonts are served with the site; there are no external font
requests, analytics, map embeds, or accounts.

## One command on the VM

First push the finished code to the branch you intend to deploy. The commands
below cannot install files that exist only in a local feature branch.

On a Debian 12/13 or Ubuntu 22.04/24.04 VM with `curl` and `sudo`, use:

**Testing / develop:**

```bash
curl -fsSL https://raw.githubusercontent.com/MattTelles7/groomsman-site/develop/install.sh | sudo bash -s -- --branch develop
```

**Stable / main**, after a release has been merged into `main`:

```bash
curl -fsSL https://raw.githubusercontent.com/MattTelles7/groomsman-site/main/install.sh | sudo bash -s -- --branch main
```

The same command works for a fresh installation and later updates. It:

1. Installs missing system dependencies, Docker Engine, and Compose.
2. Enables Docker at boot.
3. Clones or fast-forwards the requested branch in `/opt/groomsman-site`.
4. Creates `.env` if missing and preserves existing settings.
5. Tests and builds the site while the existing container stays up.
6. Recreates the app container and checks that the new image is healthy.

The site listens on **port 3000** by default. Visit `http://YOUR_VM_IP:3000` on
your network. For a bare Debian installation, install `curl` and `sudo` as root
first (`apt-get update && apt-get install -y curl sudo`), or download the script
with `curl -o /tmp/groomsman-install.sh` and run it as root without `sudo`.

**Private GitHub repository?** An unauthenticated raw-GitHub URL returns 404.
Use the authenticated bootstrap in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Later updates

```bash
sudo /opt/groomsman-site/update.sh
```

Omitting `--branch` keeps the current branch. To switch a VM between the two:

```bash
sudo /opt/groomsman-site/update.sh --branch develop
sudo /opt/groomsman-site/update.sh --branch main
```

Updates stop on dirty or diverged checkouts. They do not discard local edits,
reset branches, or overwrite `.env`. Make schedule edits in your development
checkout, commit/push them, then run the VM updater.

## Point Cloudflare at it

If `cloudflared` runs directly on the VM, set the tunnel’s published application
service to **`http://localhost:3000`**. Choose your own hostname in Cloudflare.
The browser uses HTTPS through Cloudflare; the local tunnel hop uses HTTP.
See [Cloudflare’s tunnel guide](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)
and [our deployment notes](docs/DEPLOYMENT.md#cloudflare).

## Update the schedule

Edit **[src/data/schedule.ts](src/data/schedule.ts)**:

- `wedding`: wedding date, ceremony instant, and timezone.
- `venues`: addresses reused by every matching card.
- `events`: times, notes, colors/categories, and activity intervals.
- `days`: Thursday and Saturday date labels.

The countdown targets **Saturday, September 26 at 2:00 PM Eastern**, when Mass
starts. Thursday is **September 24**. Every timed event has an explicit `-04:00`
offset, so a guest’s phone timezone does not change the schedule.

The interface follows the system color scheme automatically. The header theme
button cycles **system → light → dark → system**, remembering that preference
only on the current device. Motion follows the device’s reduced-motion setting.

An activity with a known start/end interval gets the live outline and progress
line. Past events stay readable. Approximate times are labeled as approximate;
TBD starts do not get invented countdowns. Open-ended entries are milestones,
so they do not remain “live” indefinitely. The page recovers the current time
when a phone wakes or the tab comes back into focus.

Click or tap any location card to copy its full address. On plain HTTP or if
clipboard access is blocked, a dialog selects the address for manual copying.
Updates appear on reload; a page already open keeps its loaded schedule.

See [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) for examples and
[docs/PLANNING.md](docs/PLANNING.md) for outstanding decisions and address sources.

## Git workflow

- `main`: stable release branch, merged by the project owner.
- `develop`: integration and VM testing.
- `feature/*`, `fix/*`: focused changes based on `develop`.
- Commit after each significant change. Run checks before integrating.

Typical change:

```bash
git switch develop
git pull --ff-only
git switch -c feature/update-wedding-plan
# Edit src/data/schedule.ts
npm run check
git add src/data/schedule.ts
git commit -m "Update wedding day schedule"
git push -u origin feature/update-wedding-plan
```

Merge to `develop`, update the test VM, then select the release for `main`.

## Checks

```bash
npm run check
bash -n install.sh update.sh scripts/deploy.sh
```

`npm run check` runs TypeScript checks, schedule/countdown regression tests,
installer tests using disposable local Git repositories, and the production
build. GitHub Actions additionally runs ShellCheck and builds,
starts, and checks the Docker deployment. The container build also runs the
application checks. Browser review steps are in the customization guide.

## Docker locally

```bash
cp .env.example .env
docker compose up -d --build --wait
```

Open [localhost:3000](http://localhost:3000). `APP_PORT` and `BIND_ADDRESS` are the
only VM settings. The runtime serves static files with Nginx as a non-root user
and has no database or persistent application data.

## Troubleshooting

```bash
cd /opt/groomsman-site
sudo docker compose ps
sudo docker compose logs --tail=80 app
curl --fail http://localhost:3000/healthz
sudo systemctl status docker
```

If a build fails, the existing container continues serving the previous build.
If startup fails after container replacement, inspect the logs; the installer
reports failure and does not claim the deployment succeeded. See
[deployment troubleshooting](docs/DEPLOYMENT.md#troubleshooting) for recovery.

The site asks search engines not to index it, but that is not authentication.
Only publish content you want people with the link to read. Bus payment notes
remain in repository documentation and are not included in the web bundle.
