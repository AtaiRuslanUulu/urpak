#!/usr/bin/env sh
set -e

# Apply migrations
python manage.py migrate --noinput

# (Optional) Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000
