FROM node:18-alpine

WORKDIR /app

# Copy only backend files
COPY package*.json ./
COPY index.js ./
COPY hono.js ./
COPY trpc/ ./trpc/

# Install dependencies
RUN npm install --legacy-peer-deps

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
