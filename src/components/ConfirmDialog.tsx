interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-gray-800 text-sm mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
