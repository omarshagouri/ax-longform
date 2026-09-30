# 1. Use Microsoft's official Playwright Python base image (pre-loaded with Chromium + libraries)
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

# 2. Prevent Python from buffering outputs (helps with container logs)
ENV PYTHONUNBUFFERED=1

# 3. Install ffmpeg and clean up apt caches to keep the image small
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# 4. Set the working directory inside the container
WORKDIR /app

# 5. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy your agent render code into the container
COPY . .

# 7. Define the command to start your render script
CMD ["python", "render_agent.py"]
