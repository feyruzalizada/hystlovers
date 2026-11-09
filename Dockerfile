# Payload 3.93 needs Node ^22.23.4 or >=24.22.1.
ARG NODE_VERSION=22.23.4
FROM node:${NODE_VERSION}-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
# Dev dependencies stay: migrations and the seed run through tsx on start.
RUN npm ci --no-audit --no-fund

COPY --chown=node:node . .

# Pages are prerendered from the database, which only exists at run time:
# the image is compiled here and the entrypoint prerenders it.
RUN PAYLOAD_SECRET=build-only NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" \
    npx next build --experimental-build-mode=compile

ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
