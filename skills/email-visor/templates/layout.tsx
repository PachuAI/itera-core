import Link from 'next/link'
// ADAPT (1 de los 4 puntos): importá y llamá el guard de admin de TU repo.
// Ejemplos reales del ecosistema:
//   itera-lex: import { getSuperAdminOrRedirect } from '@/lib/auth/...'    -> await getSuperAdminOrRedirect()
//   shope-ar:  import { requirePlatformAccess } from '@/lib/platform/require-platform-access' -> await requirePlatformAccess()
//   presskit:  import { requireAdminPage } from '@/lib/api-helpers'        -> await requireAdminPage()
import { requireAdminPage } from '@/lib/api-helpers'

// Páginas server con guard de sesión → dinámicas.
export const dynamic = 'force-dynamic'

export default async function EmailPreviewsLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage() // ADAPT: usá el guard de tu repo

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>
        <span>/</span>
        <span className="text-foreground">Email previews</span>
      </nav>
      {children}
    </div>
  )
}
