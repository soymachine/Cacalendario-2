#!/usr/bin/env bash
# Levanta un Supabase local idéntico a producción (supabase/schema/prod_baseline.sql
# + migraciones posteriores) y ejecuta el simulador de 1 médico + 9 pacientes.
#
#   bash tests/sim/local.sh                 # semilla 1 (reproducible)
#   SIM_SEED=random bash tests/sim/local.sh # otra variante del mes
#   SIM_KEEP=1 bash tests/sim/local.sh      # no para Supabase al terminar
#
# El informe se sube a /admin → Simulaciones del proyecto indicado en
# SIM_REPORT_URL/SIM_REPORT_KEY/SIM_REPORT_TOKEN; sin ellas, al propio
# Supabase local (útil con SIM_KEEP=1 para verlo en el /admin local).
#
# Requiere Docker. Cada ejecución resetea la base de datos: no hay que limpiar.
# Si no se puede descargar de public.ecr.aws: SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SIM="$ROOT/tests/sim"
SUPABASE="npx -y supabase@${SUPABASE_CLI_VERSION:-2.122.0} --workdir $SIM"
# Las migraciones del repo anteriores al snapshot ya están dentro de él.
BASELINE_DATE=20261030

docker info >/dev/null 2>&1 || { echo "Docker no está disponible (¿está arrancado el daemon?)"; exit 2; }

MIG="$SIM/supabase/migrations"
rm -rf "$MIG" && mkdir -p "$MIG"
cp "$ROOT/supabase/schema/prod_baseline.sql" "$MIG/${BASELINE_DATE}000000_prod_baseline.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  [[ "$(basename "$f" | cut -c1-8)" > "$BASELINE_DATE" ]] && cp "$f" "$MIG/"
done
cp "$SIM/supabase/sim_overrides.sql" "$MIG/99999999999999_sim_overrides.sql"
echo "Migraciones: $(ls "$MIG" | tr '\n' ' ')"

EXCLUDE=studio,imgproxy,realtime,mailpit,logflare,vector,postgres-meta,supavisor,edge-runtime
$SUPABASE status >/dev/null 2>&1 || $SUPABASE start -x "$EXCLUDE"
$SUPABASE db reset --no-seed
[[ "${SIM_KEEP:-}" == "1" ]] || trap '$SUPABASE stop --no-backup >/dev/null 2>&1 || true' EXIT

eval "$($SUPABASE status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
cd "$ROOT"
export SIM_REPORT_URL="${SIM_REPORT_URL:-$API_URL}" SIM_REPORT_KEY="${SIM_REPORT_KEY:-$ANON_KEY}" SIM_REPORT_TOKEN="${SIM_REPORT_TOKEN:-local-sim-token}"
SIM_SUPABASE_URL="$API_URL" SIM_ANON_KEY="$ANON_KEY" SIM_SERVICE_KEY="$SERVICE_ROLE_KEY" TZ=Europe/Madrid \
  node --experimental-strip-types --no-warnings=ExperimentalWarning tests/sim/run.ts
