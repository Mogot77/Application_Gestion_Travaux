export type SegProps<K extends string | number> = {
  values: (K | { k: K; l: string })[]
  sel: K | null | undefined
  onPick: (k: K) => void
  clsFor?: (k: K) => string
  className?: string
  label?: string
}
