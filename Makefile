# ========= Django Makefile =========

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

# если venv не существует — создаём её автоматически
$(VENV)/bin/activate:
	python3 -m venv $(VENV)
	@echo "✅ Virtual environment создана в $(VENV)"
	@echo "ℹ️  Активировать вручную: source $(VENV)/bin/activate"

# --- команды установки и запуска ---
setup: $(VENV)/bin/activate
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "✅ Установлены зависимости. Теперь можно: make run"

run: $(VENV)/bin/activate
	source $(VENV)/bin/activate && python manage.py runserver 0.0.0.0:8000

migrate: $(VENV)/bin/activate
	source $(VENV)/bin/activate && python manage.py migrate

makemigrations: $(VENV)/bin/activate
	source $(VENV)/bin/activate && python manage.py makemigrations

superuser: $(VENV)/bin/activate
	source $(VENV)/bin/activate && python manage.py createsuperuser

shell: $(VENV)/bin/activate
	source $(VENV)/bin/activate && python manage.py shell

collectstatic: $(VENV)/bin/activate
	source $(VENV)/bin/activate && python manage.py collectstatic --noinput

health:
	curl -s http://localhost:8000/healthz || echo "❌ не отвечает /healthz"
