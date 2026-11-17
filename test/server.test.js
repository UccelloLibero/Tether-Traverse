const { test, before } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
let server;
let base;

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer().on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

before(async () => {
  const port = await freePort();
  server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { PORT: String(port), NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  // Keep reading stdout so later log lines don't hit a closed pipe.
  await new Promise((resolve) => {
    server.stdout.on('data', (chunk) => String(chunk).includes('listening') && resolve());
  });
  base = `http://127.0.0.1:${port}`;
});

test('home page is the game', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
});

test('scripts, styles and assets are served', async () => {
  for (const file of ['css/styles.css', 'play/game.js', 'manifest.webmanifest', 'assets/MountRainier.jpg']) {
    const res = await fetch(`${base}/${file}`);
    assert.equal(res.status, 200, file);
    assert.equal((await res.arrayBuffer()).byteLength, fs.statSync(path.join(ROOT, file)).size, file);
  }
});

test('index.html references only files that exist', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const local = [...html.matchAll(/(?:src|href)="(?!https?:|#|mailto:)\/?([^"?#]+)"/g)].map((m) => m[1]);
  assert.ok(local.length > 0);
  for (const file of local) assert.ok(fs.existsSync(path.join(ROOT, file)), file);
});

test('unknown paths fall back to the game', async () => {
  const res = await fetch(`${base}/some/deep/link`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<html/i);
});

test('exits cleanly and promptly on SIGTERM', async () => {
  const start = Date.now();
  server.kill('SIGTERM');
  const [code] = await once(server, 'exit');
  assert.equal(code, 0);
  assert.ok(Date.now() - start < 2000, `took ${Date.now() - start} ms`);
});
