import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer, width = '500px' }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="flex flex-col bg-white border border-gray-300 rounded shadow overflow-hidden"
        style={{ width, maxWidth: '90vw', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded hover:bg-gray-200 p-1 transition-colors duration-150 text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-300">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
