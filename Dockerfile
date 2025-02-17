# Use official Python image
FROM python:3.11

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y python3-pip python3-venv

# Copy project files
COPY . /app/

# Create virtual environment & install dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip && pip install -r requirements.txt

# Start command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
