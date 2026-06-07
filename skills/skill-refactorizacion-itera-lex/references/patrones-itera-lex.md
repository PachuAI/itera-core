# Patrones Itera Lex

Base tomada de refactorizaciones reales en `ITERA Lex`: biblioteca de archivos, `leadsService`, CRM/onboarding UI y `archivosService`.

## Patrones que si dieron retorno

- Extraer UI repetida entre tabs hermanas a un componente compartido antes de tocar hooks o services.
- Convertir componentes grandes en shells de orquestacion y mover el render pesado a piezas chicas y verificables.
- Centralizar server actions repetidas de una integracion externa en helpers internos, manteniendo intactas las actions publicas de cada entrypoint.
- Unificar wrappers de entidades hermanas cuando solo cambia el adapter de datos.
- Consolidar tipos serializados del feature para evitar drift entre vistas globales y tabs.
- Mantener una fachada publica chica y mover internals a un directorio por responsabilidad.
- Separar validaciones de ownership/FK antes de separar writes transaccionales.
- Deduplicar builders internos despues de extraer el modulo responsable, no antes.
- Commitear cada corte chico cuando se trabaja en una tanda larga.

## Obstaculos detectados

- La duplicacion relevante no siempre esta en el mismo archivo; muchas veces aparece entre rutas o tabs hermanas.
- Un modulo puede parecer problema de UI, pero despues del primer corte el verdadero cuello de botella pasa a ser un hook orquestador.
- Integraciones externas fuertes, como Google Drive, empujan a sobreinvertir en UX especifica aunque el limite real venga por negocio, permisos o verificacion.
- Los modulos grandes mezclan demasiado rapido responsabilidades de workspace local con responsabilidades del provider remoto.
- Los services grandes esconden varios dominios bajo nombres genericos: invitaciones, onboarding, trial, emails, tracking, biblioteca, vinculacion, clasificacion y borrado.
- La extension tenant de Prisma puede inyectar `tenantId` en runtime aunque el tipo generado lo exija; si aparece cast, conviene dejarlo acotado y comentado cerca del write.
- Separar demasiado tarde los tipos/selects hace que los siguientes cortes arrastren imports publicos inestables.

## Metodo que acelero mas

1. Mapear superficie real del modulo antes de editar.
2. Tomar un punto de corte chico y defendible.
3. Mantener estable la surface publica mientras se mueve la implementacion interna.
4. Validar despues de cada corte con typecheck y lint.
5. Actualizar docs vivas del repo en la misma pasada para no perder contexto.
6. Commit por corte cuando la tanda es larga.
7. Commit de docs al cerrar el frente.

## Regla especifica que aparecio en este repo

Si el provider externo todavia no tiene adoption real o esta limitado por compliance/costos, priorizar la frontera `workspace vs provider` en vez de seguir puliendo UX del provider.

## Secuencia probada en `archivos`

1. Centralizar actions repetidas de Drive y carpetas.
2. Extraer cross-refs duplicadas entre `clientes` y `causas`.
3. Hacer que el browser distinga mejor seleccion de archivos vs carpetas.
4. Partir `ArchivosTabContent` en shell + piezas de render.
5. Partir la vista global en lista/detalle.
6. Unificar wrappers de tabs por entidad.
7. Dejar documentado que el siguiente frente correcto es `workspace vs provider`, no mas UX de Drive.

## Secuencia probada en `leadsService`

1. Mantener `leadsService(db?)` como fachada publica.
2. Extraer `leads/types.ts` con selects, buckets, tipos de evento y helpers puros.
3. Separar `invitations.ts`: creacion de invitacion, token hash, invalidacion de invitaciones anteriores, email final y tracking de delivery.
4. Separar `onboarding.ts`: resolucion publica por token, visitas idempotentes, submission y eventos.
5. Separar `trial-tenants.ts`: creacion/vinculacion de tenant trial y eventos asociados.
6. Preservar la API publica del service y validar cada corte con test puntual del service, typecheck y lint.
7. Frenar cuando la fachada queda legible y los siguientes cortes implican reordenar semantica de negocio, no solo modularidad.

## Secuencia probada en CRM UI/onboarding publico

1. Pantalla admin grande -> extraer helpers puros de presentacion.
2. Extraer componentes chicos repetibles (`InfoRow`, tabs, cards de resumen).
3. Dejar la page como shell server/client de composicion.
4. En formularios grandes, separar opciones/defaults/payload antes de partir campos con fuerte acoplamiento a `react-hook-form`.
5. Frenar cuando el siguiente paso exige prop drilling o generics de formulario con bajo retorno.

## Secuencia probada en `archivosService`

1. Mantener `archivosService(db, tenantId?)` como fachada publica estable.
2. Extraer `archivos/types.ts`: select principal, tipos publicos/reexportados, normalizacion provider-neutral y helpers de cuota.
3. Extraer `target-validation.ts`: ownership de Causa/Cliente y validacion de target.
4. Extraer `biblioteca.ts`: resumen y listados sin side effects.
5. Extraer `linking.ts`: vinculacion Drive/R2, locks advisory y altas.
6. Extraer `deletion.ts`: desvincular/eliminar global, quota release y cleanup nativo R2.
7. Deduplicar alta de `ArchivoVinculado` con builder interno, manteniendo casts tenant acotados junto al `create`.
8. Separar `classification.ts` cuando queda claro que reclasificar no pertenece a linking.
9. Centralizar helpers de cleanup R2 compartidos.
10. Frenar cuando la fachada baja a ~100 lineas y los internals quedan en tamanos razonables; seguir partiria flujo transaccional sin mucho retorno.

## Criterios de meseta observados

- Fachada menor a 150 lineas y sin logica de negocio pesada.
- Internals con responsabilidades nombrables y sin mezclar lecturas/writes/externos.
- Archivos concentradores restantes por debajo de 300-400 lineas o con complejidad accidental baja.
- Siguiente corte requiere cambiar contrato publico, prop drilling amplio o partir una transaccion delicada.
- Las validaciones ya pasan y los docs vivos reflejan la nueva ubicacion.
