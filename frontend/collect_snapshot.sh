# save as collect_snapshot.sh, then: bash collect_snapshot.sh
set -euo pipefail

SNAPSHOT_DIR="snapshot_$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$SNAPSHOT_DIR"

# 1) Структура проекта (без тяжелых папок)
if command -v tree >/dev/null 2>&1; then
  tree -a -I 'node_modules|.git|dist|build|.next|coverage|.turbo|out|venv|.venv' > "$SNAPSHOT_DIR/TREE.txt"
else
  echo "⚠️ tree не найден, использую find" > "$SNAPSHOT_DIR/TREE.txt"
  find . -path './.git' -prune -o -path './node_modules' -prune -o -path './dist' -prune -o -path './build' -prune -o -path './.next' -prune -o -path './coverage' -prune -o -print >> "$SNAPSHOT_DIR/TREE.txt"
fi

# 2) Git-контекст
git rev-parse --abbrev-ref HEAD > "$SNAPSHOT_DIR/GIT_BRANCH.txt" || true
git rev-parse HEAD > "$SNAPSHOT_DIR/GIT_COMMIT.txt" || true
git status -sb > "$SNAPSHOT_DIR/GIT_STATUS.txt" || true
git log --graph --decorate --oneline -n 50 > "$SNAPSHOT_DIR/GIT_LOG_50.txt" || true
git remote -v > "$SNAPSHOT_DIR/GIT_REMOTES.txt" || true

# 3) package.json / менеджеры пакетов
if [ -f package.json ]; then
  # краткое резюме по package.json (если есть jq)
  if command -v jq >/dev/null 2>&1; then
    jq '{name,version,private,type,scripts,dependencies,devDependencies,engines}' package.json > "$SNAPSHOT_DIR/PACKAGE_SUMMARY.json"
  else
    cp package.json "$SNAPSHOT_DIR/package.json"
  fi

  # список зависимостей top-level
  if command -v pnpm >/dev/null 2>&1; then
    pnpm ls --depth=0 > "$SNAPSHOT_DIR/DEPS_pnpm_depth0.txt" 2>&1 || true
  fi
  if command -v npm >/dev/null 2>&1; then
    npm ls --depth=0 > "$SNAPSHOT_DIR/DEPS_npm_depth0.txt" 2>&1 || true
  fi
  if command -v yarn >/dev/null 2>&1; then
    yarn list --depth=0 > "$SNAPSHOT_DIR/DEPS_yarn_depth0.txt" 2>&1 || true
  fi

  # типскрипт-конфиг
  [ -f tsconfig.json ] && cp tsconfig.json "$SNAPSHOT_DIR/tsconfig.json"
fi

# 4) Бэкенд-артефакты (копируем, если существуют)
for f in vercel.json vercel.*.json next.config.* nuxt.config.* vite.config.* astro.config.* \
         remix.config.* svelte.config.* \
         docker-compose*.yml Dockerfile* Procfile \
         railway.json Railway.toml fly.toml \
         prisma/schema.prisma drizzle.config.* ormconfig.* knexfile.* \
         openapi.*.yml openapi.*.yaml openapi.*.json swagger.*.json \
         package-lock.json pnpm-lock.yaml yarn.lock bun.lockb; do
  for hit in $f; do
    [ -e "$hit" ] && mkdir -p "$SNAPSHOT_DIR/$(dirname "$hit")" && cp -R "$hit" "$SNAPSHOT_DIR/$hit"
  done
done

# 5) Сбор env-примеров (без значений!)
# Собираем имена переменных из .env* и записываем пустые значения
ENV_OUT="$SNAPSHOT_DIR/ENV_EXAMPLE.env"
: > "$ENV_OUT"
shopt -s nullglob
for envf in .env .env.*; do
  if [ -f "$envf" ]; then
    # берем только строки вида KEY=VALUE, выбрасываем комментарии и пустые
    awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1"="}' "$envf" >> "$ENV_OUT"
  fi
done
# удаляем дубли
sort -u -o "$ENV_OUT" "$ENV_OUT" || true

# 6) Поиск TODO/FIXME
grep -RIn --exclude-dir={.git,node_modules,dist,build,.next,coverage} -E "TODO|FIXME" . > "$SNAPSHOT_DIR/TODOS_FIXMES.txt" || true

# 7) Роуты популярных фреймворков (best-effort)
# Next.js: страницы и app routes
if [ -d "pages" ] || [ -d "app" ]; then
  { echo "### Next/React routes (heuristic)"; find pages app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) 2>/dev/null; } > "$SNAPSHOT_DIR/ROUTES_guess.txt" || true
fi
# Express/Nest/Fastify — просто берём файлы с маршрутами по паттернам
grep -RIn --exclude-dir={.git,node_modules,dist,build,.next,coverage} -E "router\.|app\.get|app\.post|app\.use|@Get\(|@Post\(|fastify\.get|fastify\.route" . > "$SNAPSHOT_DIR/ROUTES_backend_guess.txt" || true

# 8) Лицензия/README
[ -f README.md ] && cp README.md "$SNAPSHOT_DIR/README.md"
[ -f LICENSE ] && cp LICENSE "$SNAPSHOT_DIR/LICENSE"

# 9) Упаковка
ARCHIVE_NAME="$(basename "$PWD")_${SNAPSHOT_DIR}.tar.gz"
tar -czf "$ARCHIVE_NAME" "$SNAPSHOT_DIR"
echo "✔ Готово: $ARCHIVE_NAME"
