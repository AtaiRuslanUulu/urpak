# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all frontend files
COPY . .  # Instead of `COPY frontend .`

# Build Next.js app
RUN npm run build

# Start Next.js
CMD ["npm", "start"]
