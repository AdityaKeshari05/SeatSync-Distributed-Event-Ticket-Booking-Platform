FROM node:20-alpine

WORKDIR /app

# Install dependencies first (leverages Docker cache)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

# Run in dev mode for hot-reloading
CMD ["npm", "run", "dev"]