FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy backend source files
COPY index.js ./
COPY hono.js ./

# Copy trpc directory
COPY trpc/ ./trpc/

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
