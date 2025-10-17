FROM node:18-alpine

WORKDIR /app

# Install system dependencies for video processing
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    && python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install yt-dlp \
    && ln -s /opt/venv/bin/yt-dlp /usr/local/bin/yt-dlp

# Copy package files first
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy all backend files
COPY . .

# Build TypeScript to JavaScript (explicitly specify tsconfig)
RUN npx tsc --project tsconfig.json

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
