// Codifica/decodifica los inputs del template en un query param (`?input=...`)
// para que el preview sea linkeable y editable sin estado server. Sin deps.

export function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function base64UrlDecode(value: string): string | null {
  try {
    const padded = value
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

export function decodeInputParam(
  value: string | string[] | undefined
): Record<string, unknown> | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const decoded = base64UrlDecode(value)
  if (!decoded) {
    return null
  }

  try {
    const parsed = JSON.parse(decoded)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
