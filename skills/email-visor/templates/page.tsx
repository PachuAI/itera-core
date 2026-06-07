import Link from 'next/link'
import { Mail } from 'lucide-react'
import { EMAIL_REGISTRY, type EmailTemplateStatus } from '@/lib/email/registry'
import { Badge } from '@/components/ui/badge'
import { EMAIL_PREVIEWS_BASE_PATH } from './_lib/constants'

export const metadata = { title: 'Email previews · Admin' }

const STATUS_ORDER: EmailTemplateStatus[] = ['active', 'pending', 'legacy', 'active_dev_only']

export default function EmailPreviewsPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="rounded-lg border bg-card p-3">
        <div className="mb-3 px-1">
          <h1 className="text-lg font-semibold tracking-tight">Email previews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Templates transaccionales renderizados con datos de ejemplo.
          </p>
        </div>

        <div className="space-y-4">
          {STATUS_ORDER.map((status) => {
            const templates = EMAIL_REGISTRY.filter((template) => template.status === status)
            if (templates.length === 0) {
              return null
            }

            return (
              <section key={status} className="space-y-1.5">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {statusLabel(status)}
                </p>
                <div className="grid gap-1">
                  {templates.map((template) => (
                    <Link
                      key={template.key}
                      href={`${EMAIL_PREVIEWS_BASE_PATH}/${template.key}`}
                      className="flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="truncate">{template.label}</span>
                      <StatusBadge status={template.status} />
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </aside>

      <section className="grid min-h-[400px] place-items-center rounded-lg border bg-card">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Mail className="size-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Seleccioná un template</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elegí una plantilla de la lista para abrir el preview.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: EmailTemplateStatus }) {
  return (
    <Badge variant={status === 'active' ? 'secondary' : 'outline'} className="capitalize">
      {statusLabel(status)}
    </Badge>
  )
}

function statusLabel(status: EmailTemplateStatus) {
  const labels: Record<EmailTemplateStatus, string> = {
    active: 'active',
    pending: 'pending',
    legacy: 'legacy',
    active_dev_only: 'dev only',
  }

  return labels[status]
}
