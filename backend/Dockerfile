# Use a Python 3.10 slim base image (Debian-based)
FROM python:3.10-slim

# Install system dependencies: curl, ffmpeg, and build tools
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory to app root inside the container
WORKDIR /app

# Copy package files and install production Node.js dependencies
COPY package*.json ./
RUN npm install --production

# Copy python requirements and install PyTorch (CPU-only version) and Whisper
COPY python/requirements.txt ./python/
RUN pip3 install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip3 install --no-cache-dir -r python/requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose backend port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
