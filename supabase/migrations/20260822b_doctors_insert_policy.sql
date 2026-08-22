-- ============================================================================
-- Fluxia — Un usuario solo puede crear SU propia ficha de médico
-- ----------------------------------------------------------------------------
-- Quedaba de una migración antigua la política "Authenticated users can insert
-- doctors" con WITH CHECK (true). Como las políticas permisivas se suman, esa
-- dejaba sin efecto a `doctors_self_insert`: cualquier usuario autenticado
-- podía insertar una fila en `doctors` con el `id` de otro usuario (dándole
-- acceso al panel médico) o con un plan arbitrario.
--
-- `doctors_self_insert` ya cubre el único alta legítima desde el cliente:
-- id = auth.uid() y plan en ('free','beta','test'). El alta que crea el
-- administrador va por `admin_create_center`, que es SECURITY DEFINER y no
-- pasa por RLS.
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can insert doctors" ON public.doctors;
