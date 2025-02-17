# Use Node.js as base image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm install

# Copy the entire frontend folder to the container
COPY frontend ./

# Build the Next.js app
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
