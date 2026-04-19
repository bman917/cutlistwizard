interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    }}>
      <div style={{
        backgroundColor: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
        padding: '24px',
        maxWidth: '360px',
        width: 'calc(100% - 32px)',
        fontFamily: 'var(--font-sans)',
      }}>
        <p style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '7px 18px',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-sans)',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-text-muted)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '7px 18px',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-sans)',
              borderRadius: '4px',
              border: '1px solid rgba(192,57,43,0.6)',
              backgroundColor: 'rgba(192,57,43,0.15)',
              color: '#e07070',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(192,57,43,0.3)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#f08080'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(192,57,43,0.15)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#e07070'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
