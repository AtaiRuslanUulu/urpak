# Use the official Python image
FROM python:3.11

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y python3-pip

# Copy files to the container
COPY requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Command to start the application (adjust based on your app)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
