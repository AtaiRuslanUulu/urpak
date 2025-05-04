#!/usr/bin/env sh
set -e

# Apply migrations
python manage.py migrate --noinput

# (Optional) Collect static files
python manage.py collectstatic --noinput

if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$RUN_SUPERUSER" != "no" ]; then
  echo "Creating superuser $DJANGO_SUPERUSER_USERNAME ..."
  python manage.py createsuperuser \
    --no-input \
    --username "$DJANGO_SUPERUSER_USERNAME" \
    --email "$DJANGO_SUPERUSER_EMAIL" || true
fi

# Start Gunicorn
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000
