---
name: operational-audit
description: 'Auditoría operacional de un repo ITERA: observabilidad/logs, costos y rate limit de IA, audit trail dentro de $transaction, prompt injection, provenance, cleanup de recursos externos (R2/Drive). Correr tras features con IA, integraciones externas o acciones de dominio sensibles. /operational-audit en Claude, $operational-audit en Codex.'
model: sonnet
---

# Operational Audit

Auditoría operacional. Cubre lo que ni `/check` ni `/security-audit` ven: observabilidad, costos de IA, integridad del audit trail, y cleanup de recursos externos.

Ejecutar DESPUÉS de: features con IA, integraciones externas (Google, Gemini, Stripe), acciones de dominio sensibles (aceptar, cerrar, remover), o antes de release.

---

## 1. Observabilidad — cuando algo rompe, ¿te enterás?

```bash
# Buscar fire-and-forget sin contexto suficiente
grep -rn "\.catch(console\.error)" src --include="*.ts"
```

Para cada resultado: ¿el catch anterior loguea ID del recurso?

```bash
# Verificar manejo en integraciones externas
grep -rn "google\|gemini\|openai\|stripe" src/lib --include="*.ts" -l
```

Para cada archivo: ¿los awaits tienen try-catch?

- [ ] Toda llamada a API externa loguea en error: userId + operación + error original
- [ ] Fire-and-forget loguea con ID del recurso — no solo `.catch(console.error)`
- [ ] Las APIs externas tienen try-catch explícito — no propagan el error crudo al cliente
- [ ] Jobs async tienen estado de error en DB — no quedan en "procesando" para siempre

---

## 2. [Con IA] Costos — gasto sin techo

```bash
grep -n "budgetManager\|checkBudget\|rateLimit\|rateLimi" src/app/api --include="*.ts" -r
grep -n "copilotUsage\|trackUsage\|ledger\|usageLedger" src/app/api --include="*.ts" -r
```

- [ ] Cada llamada a IA pasa por rate limit efectivo
- [ ] Existe techo de tokens/requests por usuario/tenant por día
- [ ] El ceiling se verifica ANTES de llamar al modelo
- [ ] El ledger de uso está en el happy path — no solo en finally
- [ ] Si el ledger falla, se loguea con userId — no se pierde silenciosamente
- [ ] El ledger registra tokens reales (input + output por separado)

---

## 3. Audit trail de acciones sensibles

Identificar las acciones sensibles del proyecto (aceptar, cerrar, remover usuario, etc.) y verificar que el audit log está DENTRO de la `$transaction`:

```bash
grep -n "auditLog\|createActivity\|actividad\|activityLog" src/lib/services --include="*.ts" -r
# Verificar que aparece DENTRO del bloque $transaction, no después del await
```

- [ ] Ninguna acción sensible tiene audit log fuera de la transacción
- [ ] Si la transacción falla, el audit log también falla — nunca quedan registros fantasma

---

## 4. [Con IA / RAG] Contexto IA

```bash
# Verificar cómo se ensambla el contexto — buscar en AMBOS directorios
grep -rn "systemPrompt\|system.*prompt\|role.*system" src/lib src/app/api --include="*.ts"
grep -rn "getAIContext\|buildContext\|assembleContext" src/lib/services src/app/api --include="*.ts"
```

- [ ] Datos del usuario van como contexto — NUNCA como system prompt/instrucciones
- [ ] **Ningún dato del usuario se concatena al campo `system` del modelo**
- [ ] Defensa contra prompt injection desde contenido del usuario

```bash
grep -rn "sourceId\|source_id\|entityId\|entityIds" src/lib --include="*.ts"
```

- [ ] El ledger registra qué entidades entraron en cada request (provenance)

Si el copilot tiene side effects (writes, emails, acciones):

- [ ] Confirmación humana explícita antes de ejecutar
- [ ] Audit trail de cada acción: userId + action + result
- [ ] NUNCA writes/emails directo desde salida del modelo sin gate humano

---

## 5. [Con almacenamiento externo] Cleanup de recursos

```bash
grep -rn "upload\|r2\|s3\|drive\|storage" src/lib --include="*.ts" -l
```

Para cada archivo con uploads:

- [ ] El catch limpia el recurso si el proceso falla después de subir
- [ ] Patrón: `try { upload → process → save } catch { deleteUploaded → rethrow }`
- [ ] No hay recursos huérfanos si el procesamiento falla

---

## Veredicto

| Área                           | Estado | Notas |
| ------------------------------ | ------ | ----- |
| Observabilidad / logs          |        |       |
| Fallos APIs externas           |        |       |
| Rate limit / ceilings IA       |        |       |
| Ledger de uso IA               |        |       |
| Audit trail acciones sensibles |        |       |
| Prompt injection / data min.   |        |       |
| Provenance / trazabilidad      |        |       |
| Side effects del copilot       |        |       |
| Cleanup de recursos externos   |        |       |

**GO** = áreas relevantes OK → se puede mergear/deployar
**NO-GO** = ítem crítico sin resolver → no mergear hasta resolverlo
