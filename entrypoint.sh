#!/usr/bin/env sh
set -e

# 1) Применяем миграции
python manage.py migrate --noinput

# 2) Собираем статику (если нужно)
python manage.py collectstatic --noinput

# 3) Создаем супер-пользователя только если его нет
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ "${RUN_SUPERUSER}" != "no" ]; then
  EXISTS=$( \
    python manage.py shell -c "from django.contrib.auth import get_user_model; \
      print(get_user_model().objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists())" \
  )

  if [ "$EXISTS" = "False" ]; then
    echo "Creating superuser '$DJANGO_SUPERUSER_USERNAME' …"
    python manage.py createsuperuser --no-input \
      --username "$DJANGO_SUPERUSER_USERNAME" \
      --email    "$DJANGO_SUPERUSER_EMAIL"
  else
    echo "Superuser '$DJANGO_SUPERUSER_USERNAME' already exists, skipping."
  fi
fi

# 4) Стартуем Gunicorn
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000
