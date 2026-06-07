import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTemplateByKey, type EmailTemplateStatus } from '@/lib/email/registry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputForm } from '../_components/input-form'
import { PendingEmptyState } from '../_components/pending-empty-state'
import { PreviewFrame } from '../_components/preview-frame'
import { decodeInputParam } from '../_lib/input-encoder'
import { withLocalAssets } from '../_lib/render-preview'
import { EMAIL_PREVIEWS_BASE_PATH } from '../_lib/constants'

type Props = {
  params: Promise<{ key: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props) {
  const { key } = await params
  const descriptor = getTemplateByKey(key)

  return {
    title: descriptor ? `${descriptor.label} · Email previews` : 'Email preview · Admin',
  }
}

export default async function EmailPreviewDetailPage({ params, searchParams }: Props) {
  const { key } = await params
  const descriptor = getTemplateByKey(key)

  if (!descriptor) {
    notFound()
  }

  if (descriptor.status === 'pending' || !descriptor.builder) {
    return (
      <div className="space-y-5">
        <PreviewHeader descriptor={descriptor} />
        <PendingEmptyState descriptor={descriptor} />
      </div>
    )
  }

  const query = await searchParams
  const decoded = decodeInputParam(query.input)
  const inputs = decoded ?? descriptor.defaultInputs
  const render = descriptor.builder as (input: Record<string, unknown>) => string
  const html = withLocalAssets(render(inputs))

  return (
    <div className="space-y-5">
      <PreviewHeader descriptor={descriptor} />
      <div className="grid gap-5 xl:grid-cols-[23.75rem_minmax(0,1fr)]">
        <div className="min-w-0">
          <InputForm defaultInputs={inputs} descriptorKey={descriptor.key} />
        </div>
        <PreviewFrame html={html} initialViewport="desktop" />
      </div>
    </div>
  )
}

function PreviewHeader({
  descriptor,
}: {
  descriptor: NonNullable<ReturnType<typeof getTemplateByKey>>
}) {
  return (
    <header className="rounded-lg border bg-card p-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
        <Link href={EMAIL_PREVIEWS_BASE_PATH}>
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{descriptor.label}</h1>
            <StatusBadge status={descriptor.status} />
            <Badge variant="outline">{descriptor.audience}</Badge>
            <Badge variant="outline">{descriptor.trigger}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{descriptor.subject}</p>
          {descriptor.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{descriptor.notes}</p>
          )}
        </div>
        <div className="min-w-0 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Call site</p>
          <p className="break-all font-mono">{descriptor.callSite}</p>
        </div>
      </div>
    </header>
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
