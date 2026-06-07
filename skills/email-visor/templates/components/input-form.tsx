'use client'

import { FormEvent, useMemo, useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { base64UrlEncode } from '../_lib/input-encoder'
import { EMAIL_PREVIEWS_BASE_PATH } from '../_lib/constants'

type JsonRecord = Record<string, unknown>

export function InputForm({
  defaultInputs,
  descriptorKey,
}: {
  defaultInputs: JsonRecord
  descriptorKey: string
}) {
  const router = useRouter()
  const initialInputs = useMemo(() => cloneRecord(defaultInputs), [defaultInputs])
  const [inputs, setInputs] = useState<JsonRecord>(initialInputs)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const encoded = base64UrlEncode(JSON.stringify(inputs))
    router.replace(`${EMAIL_PREVIEWS_BASE_PATH}/${descriptorKey}?input=${encoded}`)
  }

  function handleReset() {
    setInputs(cloneRecord(defaultInputs))
    router.replace(`${EMAIL_PREVIEWS_BASE_PATH}/${descriptorKey}`)
  }

  function updateValue(path: string[], value: unknown) {
    setInputs((current) => updateNestedValue(current, path, value))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Inputs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Editá los datos y aplicá para regenerar el HTML del preview.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(inputs).map(([key, value]) => (
          <InputField key={key} fieldKey={key} value={value} path={[key]} onChange={updateValue} />
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">
          <Save className="size-4" />
          Aplicar
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>
    </form>
  )
}

function InputField({
  fieldKey,
  value,
  path,
  onChange,
}: {
  fieldKey: string
  value: unknown
  path: string[]
  onChange: (path: string[], value: unknown) => void
}) {
  const id = path.join('.')

  // Boolean: soportado para flags futuros del registry (ej: `showFooter`, `includeCta`).
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2">
        <Label htmlFor={id} className="text-sm">
          {fieldKey}
        </Label>
        <Switch id={id} checked={value} onCheckedChange={(checked) => onChange(path, checked)} />
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{fieldKey}</Label>
        <Input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : ''}
          onChange={(event) => onChange(path, Number(event.target.value))}
        />
      </div>
    )
  }

  if (value === null) {
    return (
      <NullableStringField
        id={id}
        fieldKey={fieldKey}
        value={value}
        onChange={(nextValue) => onChange(path, nextValue)}
      />
    )
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return (
      <fieldset className="space-y-3 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">{fieldKey}</legend>
        {Object.entries(value).map(([childKey, childValue]) => (
          <InputField
            key={childKey}
            fieldKey={childKey}
            value={childValue}
            path={[...path, childKey]}
            onChange={onChange}
          />
        ))}
      </fieldset>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{fieldKey}</Label>
      <Input
        id={id}
        value={String(value ?? '')}
        onChange={(event) => onChange(path, event.target.value)}
      />
    </div>
  )
}

function NullableStringField({
  id,
  fieldKey,
  value,
  onChange,
}: {
  id: string
  fieldKey: string
  value: string | null
  onChange: (value: string | null) => void
}) {
  const isNull = value === null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{fieldKey}</Label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={isNull}
            onChange={(event) => onChange(event.target.checked ? null : '')}
            className="size-3.5 accent-primary"
          />
          null
        </label>
      </div>
      <Input
        id={id}
        value={value ?? ''}
        disabled={isNull}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function updateNestedValue(current: JsonRecord, path: string[], value: unknown): JsonRecord {
  const next = cloneRecord(current)
  let cursor: JsonRecord = next

  for (const segment of path.slice(0, -1)) {
    const child = cursor[segment]
    if (!isRecord(child)) {
      cursor[segment] = {}
    }
    cursor = cursor[segment] as JsonRecord
  }

  cursor[path[path.length - 1]] = value
  return next
}

function cloneRecord(value: JsonRecord): JsonRecord {
  return JSON.parse(JSON.stringify(value)) as JsonRecord
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
