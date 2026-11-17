#!/usr/bin/env bash
# Runs the image hardened as in production and checks the game, its files, and a prompt stop.
set -euo pipefail

image=$1
base=http://127.0.0.1:8000

cleanup() {
  docker logs smoke || true
  docker rm -f smoke >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d --name smoke \
  --read-only --cap-drop ALL --security-opt no-new-privileges \
  -p 127.0.0.1:8000:8000 \
  "$image"

curl -fsS --retry 20 --retry-all-errors --retry-delay 1 -o /dev/null "$base/"
for path in /css/styles.css /play/game.js /manifest.webmanifest /assets/MountRainier.jpg; do
  curl -fsS -o /dev/null "$base$path"
done

# Only what the game needs is in the image: other paths get the game's fallback page.
home=$(curl -fsS "$base/")
for path in /README.md /Procfile; do
  if [[ $(curl -fsS "$base$path") != "$home" ]]; then
    echo "$path is served from the image" >&2
    exit 1
  fi
done

start=$SECONDS
docker stop smoke >/dev/null
if (( SECONDS - start > 5 )); then
  echo "ignored SIGTERM" >&2
  exit 1
fi

echo "smoke test passed"
