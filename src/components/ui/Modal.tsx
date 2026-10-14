import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  onClose: () => void
  children: ReactNode
  /** Rótulo acessível do diálogo (ex.: "Editar Colaborador"). */
  label?: string
}

/**
 * Modal renderizado via portal no `document.body`.
 *
 * Precisa ser portal: as páginas têm animação de entrada com `transform`
 * (fade-up com fill-mode both), o que cria um containing block que "prende"
 * o position:fixed do overlay dentro da seção — o popup ficava cortado.
 *
 * Cuida também do que faltava e produzia bug visível:
 * - **scroll lock**: o fundo continuava rolando com a roda do mouse
 *   enquanto o modal estava aberto (a tabela parecia "soltar" embaixo dele);
 * - **foco**: o Tab escapava do modal para os campos da página atrás, e o
 *   foco não voltava para o botão de origem ao fechar;
 * - **ARIA**: leitores de tela anunciavam um div genérico.
 */
export default function Modal({ onClose, children, label }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const restoreFocusTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Mantém o Tab preso dentro do modal enquanto ele estiver aberto.
      const panel = overlayRef.current
      if (!panel) return
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0)
      if (items.length === 0) return

      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)

    // Trava o scroll do fundo, compensando a largura do scrollbar para não
    // causar o "pulo" horizontal da página ao fechar.
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    restoreFocusTo.current = document.activeElement as HTMLElement | null

    return () => {
      document.removeEventListener('keydown', handler)
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding

      // Só devolve o foco ao elemento anterior se ele realmente saiu do
      // modal. Este cleanup roda a cada render do pai — e o pai passa
      // `onClose={() => ...}`, que é uma função nova a cada render. Sem
      // esta guarda, digitar uma letra no formulário disparava o cleanup,
      // que focava o elemento de origem e jogava o cursor no botão de
      // fechar no meio da escrita.
      const previous = restoreFocusTo.current
      const stillInside = previous !== null && overlayRef.current?.contains(document.activeElement)
      if (!stillInside) previous?.focus?.()
      restoreFocusTo.current = null
    }
    // onClose entra na dependencia para o handler de Esc/Escape e o
    // keydown ficarem sempre corretos, mas isso NAO pode reexecutar o resto
    // do efeito: o autofocus a cada tecla digitada jogava o foco no
    // botao de fechar no meio da escrita.
  }, [onClose])

  // Foco inicial do formulario, em efeito separado e sem dependencias:
  // roda uma vez so, na montagem. Antes isso vivia no efeito acima e
  // disparava a cada render do pai (cada tecla digitada), tirando o foco
  // do campo que a pessoa estava usando.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      overlayRef.current
        ?.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
        )
        ?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>,
    document.body,
  )
}