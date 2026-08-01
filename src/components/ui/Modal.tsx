import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  onClose: () => void
  children: ReactNode
}

/**
 * Modal renderizado via portal no `document.body`.
 *
 * Precisa ser portal: as páginas têm animação de entrada com `transform`
 * (fade-up com fill-mode both), o que cria um containing block que "prende"
 * o position:fixed do overlay dentro da seção — o popup ficava cortado.
 */
export default function Modal({ onClose, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {children}
    </div>,
    document.body,
  )
}
