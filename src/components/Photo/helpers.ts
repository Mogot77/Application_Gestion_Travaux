/** Les photos « seed » (démo) n'ont pas d'image réelle. */
export const isRealPhoto = (src?: string): src is string => !!src && src !== 'seed'
