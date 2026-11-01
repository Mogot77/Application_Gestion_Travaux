import type { ButtonHTMLAttributes } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'danger'
  size?: 'md' | 'sm'
  full?: boolean
  dashed?: boolean
}
