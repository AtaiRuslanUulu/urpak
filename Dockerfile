# Use official Python slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install OS-level dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential libpq-dev python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python deps
COPY requirements.txt /app/
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt \
    && /opt/venv/bin/pip install --no-cache-dir gunicorn whitenoise psycopg2-binary

# Add venv to PATH
ENV PATH="/opt/venv/bin:$PATH"

# Copy project code
COPY . /app/

# Expose the port
EXPOSE 8000

# On container start: run migrations, collect static, then serve
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]
