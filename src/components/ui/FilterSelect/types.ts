import type { OptItem } from '@/components/ui/Opts'

export type FilterSelectProps = {
  value: string | number
  onChange: (value: string) => void
  /** Texte de l'option vide et libellé d'accessibilité. */
  label: string
  options: OptItem[]
}
