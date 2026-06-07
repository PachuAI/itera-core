'use client'

import { useState } from 'react'
import { Copy, Monitor, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PreviewFrame({
  html,
  initialViewport = 'desktop',
}: {
  html: string
  initialViewport?: 'desktop' | 'mobile'
}) {
  const [viewport, setViewport] = useState(initialViewport)

  async function handleCopy() {
    await navigator.clipboard.writeText(html)
    toast.success('HTML copiado')
  }

  return (
    <section className="flex min-h-[680px] flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Vista desktop"
            onClick={() => setViewport('desktop')}
          >
            <Monitor className="size-4" />
          </Button>
          <Button
            type="button"
            variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Vista mobile"
            onClick={() => setViewport('mobile')}
          >
            <Smartphone className="size-4" />
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="size-4" />
          Copiar HTML
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-background p-3">
        <div
          className={cn(
            'min-h-[640px] overflow-hidden bg-card',
            viewport === 'mobile' ? 'w-[375px] max-w-full rounded-lg border shadow-md' : 'w-full'
          )}
        >
          <iframe
            title="Preview del email"
            srcDoc={html}
            sandbox="allow-same-origin"
            style={{ width: '100%', height: '100%', border: '0' }}
          />
        </div>
      </div>
    </section>
  )
}
