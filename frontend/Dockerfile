# Use Node.js as base image
FROM node:20

# Set working directory to frontend
WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --frozen-lockfile

# Copy all frontend files
COPY frontend .

# Build Next.js app
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
