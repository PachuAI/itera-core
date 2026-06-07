// ADAPT (1 de los 4 puntos): si tus emails embeben imágenes por CID (cid:...),
// reemplazá acá el CID por la ruta pública del asset para que el <img> cargue
// en el browser (en el envío real el CID lo resuelve nodemailer via attachments).
//
// Ejemplo (caso itera-lex):
//   import { EMAIL_INLINE_ASSET_CIDS } from '@/lib/email/inline-assets'
//   return html.replaceAll(`cid:${EMAIL_INLINE_ASSET_CIDS.logoWordmarkInverse}`, '/logo-wordmark-inverse.png')
//
// Si tus emails son HTML autónomo (sin CID), dejá el passthrough.
export function withLocalAssets(html: string): string {
  return html
}
