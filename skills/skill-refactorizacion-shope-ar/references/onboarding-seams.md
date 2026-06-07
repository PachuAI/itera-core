# Onboarding Seams En Shopear

Caso de estudio actual para este skill: el onboarding self-service.

## Zonas con mejor retorno de refactor

1. `src/components/onboarding/wizard.tsx`
   Mezcla navegación, validación, taxonomía de templates, disabled states y render.
   Primer corte recomendado: shared config + navigation/view-model.
2. `src/components/onboarding/signup-form.tsx`
   Mezcla estado de form, QA autofill, captcha, disponibilidad de subdominio y submit.
   Primer corte recomendado: view-model/payload seam antes de tocar el diseño.
3. `src/actions/onboarding/provision.ts`
   Boundary sensible: auth, claim/restore de `PendingStore`, provisioning, cleanup R2 y revalidation.
   Primer corte recomendado: helpers puros para claim/restore/cleanup/extra site config, sin mover guards ni semantics.
4. `src/app/marketing/(onboarding)/*`
   Las pages resuelven sesión, pending state y redirects.
   Primer corte recomendado: route shell o helper de acceso antes de tocar JSX.

## Invariantes a no romper

- `register`, `resend-verification`, `upload-logo` y `provision` hoy corren detrás de `/api/onboarding/*`.
- `PendingStore` y la cookie `onboarding_pending` sostienen el flujo entre registro, verify y wizard.
- El redirect post-provisioning depende de helpers de host/admin, no de concatenar `.shope.ar`.
- En onboarding ya hubo hardening reciente de auth; no reintroducir Server Actions directas en clientes.

## Señales de buen seam

- El archivo original pierde branching real.
- La lógica extraída puede testearse sin renderizar toda la pantalla.
- `Wizard`, `SignupForm` o la action quedan más cerca de ser orquestadores que “bolsas de todo”.

## Señales de mal seam

- Solo moviste JSX a otro archivo pero la lógica quedó igual de dispersa.
- El helper nuevo necesita `headers()`, `cookies()` o `auth()` aunque no sea un boundary.
- Cambiaste copy, naming, comportamiento y arquitectura en la misma iteración.
