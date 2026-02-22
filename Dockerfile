FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY server ./server
COPY views ./views
COPY public ./public
COPY scripts ./scripts
COPY schema.sql ./
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["sh", "-c", "node scripts/seed-chrisamaya.mjs 2>/dev/null || true; exec node server/index.mjs"]
