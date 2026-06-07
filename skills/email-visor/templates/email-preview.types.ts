// Tipos canónicos del visor de emails. Copiar a `src/lib/types/email-preview.ts`.
// El registry re-exporta estos tipos para uso en las pages.

export type EmailTemplateStatus = 'active' | 'pending' | 'legacy' | 'active_dev_only'

// ADAPT: dejá solo las audiencias que tu repo usa. Unión amplia por defecto.
export type EmailAudience = 'user' | 'tenant_admin' | 'platform_admin' | 'admin' | 'lead' | 'cli'

export type EmailTrigger = 'manual' | 'event' | 'automatic'

export type EmailTemplateDescriptor = {
  key: string
  label: string
  /** `null` para templates `pending` (declarados pero sin builder HTML todavía). */
  builder: ((input: never) => string) | null
  defaultInputs: Record<string, unknown>
  subject: string
  status: EmailTemplateStatus
  audience: EmailAudience
  trigger: EmailTrigger
  /** Dónde se dispara el envío en el código (ruta del archivo). */
  callSite: string
  notes?: string
}
