// Copiar a `src/lib/email/registry.ts` (o donde tengas tus templates) y ADAPTAR:
// - el import de tus builders
// - una entrada por cada email que tu repo envía hoy (+ los pendientes)
//
// El registry es la ÚNICA fuente del listado del visor. Agregar un email = una entrada acá.

import * as templates from '@/lib/email-templates' // ADAPT: path real de tus builders de HTML
import type { EmailTemplateDescriptor } from '@/lib/types/email-preview'

export type {
  EmailAudience,
  EmailTemplateDescriptor,
  EmailTemplateStatus,
  EmailTrigger,
} from '@/lib/types/email-preview'

export const EMAIL_REGISTRY: readonly EmailTemplateDescriptor[] = [
  // CASO A — builder con args posicionales: envolvelo para que reciba un objeto.
  // Los keys del objeto = los campos editables que muestra el InputForm.
  {
    key: 'pre_registration',
    label: 'Confirmación de pre-registro',
    builder: (i: { nombre: string; tag: string; aka: string }) =>
      templates.preRegistrationEmail(i.nombre, i.tag, i.aka),
    defaultInputs: { nombre: 'María Laura Benítez', tag: 'maria-benitez', aka: 'María B.' },
    subject: 'Tu pre-registro está confirmado',
    status: 'active',
    audience: 'user',
    trigger: 'event',
    callSite: 'src/lib/services/email.service.ts',
  },

  // CASO B — builder que YA recibe un objeto: referencia directa.
  // {
  //   key: 'welcome',
  //   label: 'Bienvenida',
  //   builder: templates.buildWelcomeEmailHtml,
  //   defaultInputs: { recipientName: 'María Laura Benítez' },
  //   subject: 'Bienvenida',
  //   status: 'active',
  //   audience: 'user',
  //   trigger: 'event',
  //   callSite: 'src/lib/services/...',
  // },

  // CASO C — pending (declarado pero sin builder todavía): builder null + status 'pending'.
  // El visor muestra un placeholder con la metadata en vez del HTML.
  // {
  //   key: 'reminder_day_7',
  //   label: 'Recordatorio día 7',
  //   builder: null,
  //   defaultInputs: {},
  //   subject: 'Te extrañamos',
  //   status: 'pending',
  //   audience: 'user',
  //   trigger: 'automatic',
  //   callSite: 'src/lib/services/... (pendiente)',
  //   notes: 'Falta crear el builder HTML.',
  // },
]

export function getTemplateByKey(key: string) {
  return EMAIL_REGISTRY.find((template) => template.key === key) ?? null
}
