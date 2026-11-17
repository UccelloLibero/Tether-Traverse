FROM node:24-slim

ENV NODE_ENV=production \
    PORT=8000 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin app

# The server serves this directory as the site, so it holds only what the game needs.
COPY server.js index.html manifest.webmanifest tether-traverse.png ./
COPY assets assets
COPY css css
COPY levels levels
COPY play play
COPY players players
COPY ui ui
COPY utils utils

USER 10001
EXPOSE 8000

CMD ["node", "server.js"]
