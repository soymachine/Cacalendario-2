#!/usr/bin/env bash
# Prueba las migraciones de supabase/migrations contra un Postgres local
# efímero con un mock mínimo de Supabase (00_mock_supabase.sql) y ejecuta los
# tests *.test.sql. Requiere los binarios de PostgreSQL (initdb, pg_ctl, psql)
# en el PATH o en /usr/lib/postgresql/*/bin. No toca ninguna base de datos real.
#
#   bash supabase/tests/run.sh
#
# Como root (contenedores), ejecútalo con un usuario sin privilegios:
#   su postgres -c 'bash supabase/tests/run.sh'
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS="$HERE/../migrations"
PG_BIN="$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb | tail -1)")"
DATA="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"

cleanup() { "$PG_BIN/pg_ctl" -D "$DATA" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

"$PG_BIN/initdb" -D "$DATA" -A trust -U postgres >/dev/null
"$PG_BIN/pg_ctl" -D "$DATA" -o "-p $PORT -k $DATA -c listen_addresses=''" -l "$DATA/log" -w start >/dev/null

export PGOPTIONS="-c client_min_messages=warning"
PSQL=("$PG_BIN/psql" -h "$DATA" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -f "$HERE/00_mock_supabase.sql"

# Solo las migraciones del módulo de comida: el resto depende de tablas
# (centers, stripe...) que el mock no reproduce. Se aplica dos veces para
# comprobar que es idempotente.
for m in "$MIGRATIONS"/20261001_food_tracking.sql "$MIGRATIONS"/20261001_food_tracking.sql; do
  "${PSQL[@]}" -f "$m"
done

for t in "$HERE"/*.test.sql; do
  echo "── $(basename "$t")"
  PGOPTIONS="-c client_min_messages=notice" "${PSQL[@]}" -t -f "$t" 2>&1 | grep -v "^\s*$" | sed -e "s/^psql:[^ ]* NOTICE:  //" -e "s/^NOTICE:  //"
done
