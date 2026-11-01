export type PhotoProps = { src?: string; w?: number; h?: number; onDelete?: () => void }

export type PhotoViewProps = PhotoProps & { onOpen?: (src: string) => void }
