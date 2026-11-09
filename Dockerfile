# Payload 3.93 needs Node ^22.23.4 or >=24.22.1.
ARG NODE_VERSION=22.23.4
FROM node:${NODE_VERSION}-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
# Dev dependencies stay: migrations and the seed run through tsx on start.
RUN npm ci --no-audit --no-fund

# docker-compose-dev.yml mounts the source over /app; node_modules stays the image's.
FROM base AS dev
# Volumes mounted here take the owner of these directories.
RUN mkdir -p .next public/media
EXPOSE 3000
CMD ["sh", "-c", "npm run seed && npm run dev"]

FROM base AS prod
COPY --chown=node:node . .

# Production starts empty, so the seed's source images and the shop's media stay out.
RUN rm -rf public/storage public/media/*

# Pages are prerendered from the database, which only exists at run time:
# the image is compiled here and the entrypoint prerenders it.
RUN PAYLOAD_SECRET=build-only NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" \
    npx next build --experimental-build-mode=compile

ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
