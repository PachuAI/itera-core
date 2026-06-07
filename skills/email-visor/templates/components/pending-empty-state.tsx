import { Construction } from 'lucide-react'
import type { EmailTemplateDescriptor } from '@/lib/types/email-preview'

// Autónomo (no depende de un EmptyState compartido). Si tu repo tiene
// `@/components/shared/empty-state`, podés reemplazar el markup por él.
export function PendingEmptyState({ descriptor }: { descriptor: EmailTemplateDescriptor }) {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="flex flex-col items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Construction className="size-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Este template todavía no tiene builder.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Está declarado en el registry pero todavía no hay HTML para renderizar en el visor.
          </p>
        </div>
        <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="font-medium text-foreground">Audience</dt>
          <dd>{descriptor.audience}</dd>
          <dt className="font-medium text-foreground">Trigger</dt>
          <dd>{descriptor.trigger}</dd>
          <dt className="font-medium text-foreground">Call site</dt>
          <dd className="break-all font-mono text-xs">{descriptor.callSite}</dd>
          {descriptor.notes && (
            <>
              <dt className="font-medium text-foreground">Notas</dt>
              <dd>{descriptor.notes}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}
