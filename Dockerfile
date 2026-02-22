FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY server ./server
COPY views ./views
COPY public ./public
COPY schema.sql ./
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "server/index.mjs"]
