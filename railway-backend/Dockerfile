FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all backend files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
