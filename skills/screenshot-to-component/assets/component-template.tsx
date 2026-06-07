// <Name>Widget — descripción corta de qué hace este widget.
// Mock visual sin estado interno. Recibe props con defaults razonables.
//
// Copiar este template a `src/lib/widgets/<Name>Widget.tsx` y completar.
// También crear `<Name>Widget.module.css` al lado.

import { Card } from "../primitives/Card";
// import { Badge } from "../primitives/Badge";
// import { IconX } from "../icons";
import styles from "./<Name>Widget.module.css";

// ─── Types ──────────────────────────────────────────────────────────
// Si el widget renderiza una lista, definir el tipo del item:

export interface <Name>Item {
  id: string;
  label: string;
  // ... más campos según lo que muestre el widget
}

// ─── Mock data ──────────────────────────────────────────────────────
// Datos realistas al dominio. Si el SaaS es de abogados argentinos,
// usar términos jurídicos argentinos + apellidos típicos.

const DEFAULT_ITEMS: <Name>Item[] = [
  { id: "1", label: "..." },
  { id: "2", label: "..." },
  // ...
];

// ─── Props ──────────────────────────────────────────────────────────

export interface <Name>WidgetProps {
  title?: string;
  items?: <Name>Item[];
  /** Acción a renderear en el header del Card (link "Ver todos", count badge, etc.). */
  action?: React.ReactNode;
}

// ─── Componente ─────────────────────────────────────────────────────

export const <Name>Widget: React.FC<<Name>WidgetProps> = ({
  title = "Título por defecto",
  items = DEFAULT_ITEMS,
  action,
}) => {
  return (
    <Card title={title} action={action}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            {/* Render del item — ajustar según lo que muestre */}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
