FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --include=dev

COPY .sequelizerc ./
COPY src ./src

USER node
EXPOSE 3000
CMD ["npm", "run", "deploy"]
