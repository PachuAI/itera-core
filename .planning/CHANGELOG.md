# Changelog - itera-core

---

## Sesión #1 - 2026-02-05

### Contexto
Primera sesión definiendo el sistema de memoria y CLAUDE.md global para proyectos ITERA.

### Logros

#### 1. Análisis de CLAUDE.md existentes
- Revisamos CLAUDE.md de 3 proyectos: alquimica-hub, presskit-ar-v2, itera-tube
- Identificamos reglas comunes agnósticas vs específicas de proyecto
- Definimos qué va en global vs qué va en cada proyecto

#### 2. CLAUDE.md Global creado
Archivo `~/.claude/CLAUDE.md` (58 líneas) con:
- Contexto: solo developer + agentic coding, simplicidad
- Entorno: fecha 2026-02-05, GMT-3, bash vs PowerShell
- Idioma: español docs, inglés código
- Output: conciso, no repetir, no explicar paso a paso
- Desarrollo: stack principal (Next.js, React, TS, Tailwind, Laravel)
- Commits: conventional commits en español
- Tools: Read antes de Edit, Task tool para exploraciones
- Seguridad: no commitear secrets, validar input
- Git: commits pequeños, no force push, preguntar antes de destructivo
- Testing: correr tests, avisar antes de deps

#### 3. Optimización de CLAUDE.md de proyectos
Limpiamos duplicados con global:
- alquimica-hub: 146 → 101 líneas (-31%)
- presskit-ar-v2: 191 → 85 líneas (-55%)
- itera-tube: 437 → 110 líneas (-75%)

#### 4. Templates creados
- `templates/CLAUDE.md` - Template para proyectos nuevos con guía de crecimiento por fases
- `global/CLAUDE.md` - Template del global

#### 5. README actualizado
- Nueva sección "CLAUDE.md - Global vs Proyecto"
- Tabla de crecimiento recomendado
- Instrucciones de instalación con paso 0 (configurar global)
- Lista de archivos actualizada

#### 6. Repositorio publicado
- https://github.com/PachuAI/itera-core
- Commit: `db473b8` - feat: sistema de memoria para Claude Code

#### 7. Análisis de calidad de proyectos
Evaluación profunda de los 3 proyectos Next.js:

**alquimica-hub (7.5/10)**
- ✅ TypeScript strict, Zod completo, estructura clara
- ❌ Tests ~0.2% coverage (solo 2 archivos)
- ❌ Sin rate limiting, monitoreo

**presskit-ar-v2 (7.5/10)**
- ✅ Servicios bien diseñados con JSDoc
- ✅ Seguridad robusta
- ❌ 0% tests (crítico)
- ❌ Uploads en filesystem

**itera-tube (8.2/10)** ⭐ REFERENCIA
- ✅ 86.74% coverage
- ✅ AI integration con Strategy pattern
- ✅ Security headers completos
- ⚠️ lib/api 36% functions coverage

#### 8. Prompts para corrección
Generamos 3 prompts self-contained para:
- Agregar tests a alquimica-hub
- Configurar Vitest + tests en presskit-ar-v2
- Completar gaps en itera-tube

### Decisiones tomadas

1. **Global vs Proyecto**: Reglas universales en global, específicas en proyecto
2. **Tamaño ideal**: Global ~60 líneas, Proyecto ~120 líneas máximo
3. **IteraTube como referencia**: Es el único con testing real
4. **No E2E tests**: Se hacen manual para ahorrar tokens
5. **Progressive disclosure**: Seguir modelo L3 del artículo de HumanLayer

### Fuentes consultadas
- https://www.humanlayer.dev/blog/writing-a-good-claude-md
- https://dev.to/cleverhoods/claudemd-best-practices-from-basic-to-adaptive-9lm

### Archivos modificados
- `~/.claude/CLAUDE.md` (creado)
- `c:\ALL MY PROJECTS\alquimica-hub\CLAUDE.md` (optimizado)
- `c:\ALL MY PROJECTS\presskit-ar-v2\CLAUDE.md` (optimizado)
- `c:\ALL MY PROJECTS\itera-tube\CLAUDE.md` (optimizado)
- `templates/CLAUDE.md` (creado)
- `global/CLAUDE.md` (creado)
- `README.md` (actualizado)
- `.planning/STATE.md` (creado)
- `.planning/CHANGELOG.md` (creado)
