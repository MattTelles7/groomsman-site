import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Real disposable Git repositories exercise the actual installer update function.
// Nothing calls apt, Docker, sudo, or a network service in these tests.
const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Deployment Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'Deployment Test', GIT_COMMITTER_EMAIL: 'test@example.invalid',
  GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
};
const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-C', cwd, ...args], { env: gitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function fixture(t: { after: (fn: () => void) => void }) {
  const root = mkdtempSync(join(tmpdir(), 'crew-deploy-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const source = join(root, 'source');
  const checkout = join(root, 'vm');
  git(root, 'init', '--bare', '--initial-branch=main', origin);
  git(root, 'clone', origin, source);
  writeFileSync(join(source, '.gitignore'), '.env\n');
  writeFileSync(join(source, 'schedule.txt'), 'original plan');
  git(source, 'add', '.');
  git(source, 'commit', '-m', 'Initial plan');
  git(source, 'push', 'origin', 'main');
  git(root, 'clone', origin, checkout);
  writeFileSync(join(checkout, '.env'), 'APP_PORT=4000\n');

  const update = (branch = 'main', repo = origin) => spawnSync('bash', [
    '-c', 'source "$1"; BRANCH="$2"; update_existing_checkout',
    'test-installer', resolve('install.sh'), branch,
  ], { env: { ...gitEnv, INSTALL_DIR: checkout, REPO_URL: repo }, encoding: 'utf8' });

  const change = (text: string) => {
    writeFileSync(join(source, 'schedule.txt'), text);
    git(source, 'add', '.');
    git(source, 'commit', '-m', 'Update plan');
    git(source, 'push', 'origin', 'HEAD');
  };
  return { origin, source, checkout, update, change };
}

test('VM fast-forwards cleanly and a repeated update preserves settings', (t) => {
  const f = fixture(t);
  f.change('revised plan');
  for (let i = 0; i < 2; i++) {
    const result = f.update();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(f.checkout, 'schedule.txt'), 'utf8'), 'revised plan');
    assert.equal(readFileSync(join(f.checkout, '.env'), 'utf8'), 'APP_PORT=4000\n');
    assert.equal(git(f.checkout, 'rev-parse', 'HEAD'), git(f.source, 'rev-parse', 'HEAD'));
  }
});

test('VM refuses local edits and leaves them intact', (t) => {
  const f = fixture(t);
  f.change('remote edit');
  writeFileSync(join(f.checkout, 'schedule.txt'), 'local edit');
  assert.notEqual(f.update().status, 0);
  assert.equal(readFileSync(join(f.checkout, 'schedule.txt'), 'utf8'), 'local edit');
});

test('VM refuses an ahead or diverged branch without resetting commits', (t) => {
  const f = fixture(t);
  writeFileSync(join(f.checkout, 'local.txt'), 'local commit');
  git(f.checkout, 'add', '.');
  git(f.checkout, 'commit', '-m', 'Local VM commit');
  const before = git(f.checkout, 'rev-parse', 'HEAD');
  assert.notEqual(f.update().status, 0);
  f.change('remote commit');
  assert.notEqual(f.update().status, 0);
  assert.equal(git(f.checkout, 'rev-parse', 'HEAD'), before);
});

test('VM refuses an incoming tracked .env before it can overwrite settings', (t) => {
  const f = fixture(t);
  writeFileSync(join(f.source, '.env'), 'APP_PORT=9999\n');
  git(f.source, 'add', '-f', '.env');
  git(f.source, 'commit', '-m', 'Accidentally track configuration');
  git(f.source, 'push', 'origin', 'main');
  const result = f.update();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /tracks .env/);
  assert.equal(readFileSync(join(f.checkout, '.env'), 'utf8'), 'APP_PORT=4000\n');
});

test('VM switches branches and retains its existing settings', (t) => {
  const f = fixture(t);
  git(f.source, 'switch', '-c', 'develop');
  f.change('develop plan');
  assert.equal(f.update('develop').status, 0);
  assert.equal(git(f.checkout, 'branch', '--show-current'), 'develop');
  assert.equal(f.update('main').status, 0);
  assert.equal(readFileSync(join(f.checkout, 'schedule.txt'), 'utf8'), 'original plan');
  assert.equal(readFileSync(join(f.checkout, '.env'), 'utf8'), 'APP_PORT=4000\n');
});

test('VM rejects an unexpected origin without changing the checkout', (t) => {
  const f = fixture(t);
  const before = git(f.checkout, 'rev-parse', 'HEAD');
  assert.notEqual(f.update('main', '/a-different-repo').status, 0);
  assert.equal(git(f.checkout, 'rev-parse', 'HEAD'), before);
});

test('raw-script bootstrap still accepts piped input and validates arguments', () => {
  const script = readFileSync(resolve('install.sh'), 'utf8');
  const help = spawnSync('bash', ['-s', '--', '--help'], { input: script, encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: install.sh/);
  const invalid = spawnSync('bash', ['-s', '--', '--branch', 'not-a-release'], { input: script, encoding: 'utf8' });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Branch must be main or develop/);
});
