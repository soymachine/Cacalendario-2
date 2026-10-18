-- Pacientes archivados (patient_links.doctor_unlinked): el profesional ya no
-- necesita que registren nada, así que no deben recibir el recordatorio de
-- inactividad («¿Hay algo nuevo que registrar hoy?…»). Los recordatorios de
-- comida ya los excluían (_shared/foodReminderJob.ts).
-- Misma función que en producción (2026-10-18) más el filtro doctor_unlinked.
CREATE OR REPLACE FUNCTION public.get_patients_needing_push()
 RETURNS TABLE(patient_id uuid, subscription jsonb)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT pl.patient_id, ps.subscription
  FROM patient_links pl
  JOIN push_subscriptions ps ON ps.user_id = pl.patient_id
  WHERE pl.status = 'accepted' AND pl.patient_id IS NOT NULL
    AND NOT COALESCE(pl.doctor_unlinked, false)
    AND (
      NOT EXISTS (SELECT 1 FROM entries e WHERE e.user_id = pl.patient_id)
      OR (
        SELECT EXTRACT(EPOCH FROM (NOW() - MAX(e.created_at)))/3600
        FROM entries e WHERE e.user_id = pl.patient_id
      ) >= COALESCE(pl.push_min_hours, 24)
    )
    AND (
      ps.last_push_sent_at IS NULL
      OR EXTRACT(EPOCH FROM (NOW() - ps.last_push_sent_at))/3600 >= 24.0 / COALESCE(pl.push_frequency, 2)
    );
$function$;
