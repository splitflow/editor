import type { DialogAction, Result } from '@splitflow/app'

export interface FileDialogAction extends DialogAction {
    accept: string
}

export function openFileDialog(action: FileDialogAction) {
    if (action.name === 'filedialog') {
        const inputElement = document.createElement('input')
        inputElement.setAttribute('type', 'file')
        inputElement.setAttribute('accept', action.accept ?? '*')
        inputElement.setAttribute('style', 'display: none;')

        inputElement.addEventListener('change', () => {
            action.close?.(inputElement.files?.[0])
            inputElement.remove()
        })
        inputElement.addEventListener('cancel', () => {
            action.close?.(undefined)
            inputElement.remove()
        })
        inputElement.click()

        return {}
    }
}

export interface UploadAction {
    type: 'upload'
    file: File
}

export interface UploadResult extends Result {
    promise: Promise<string>
}

export function uploadFile(action: UploadAction): UploadResult {
    // dummy implementation
    const promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(action.file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
    })

    return {
        promise
    }
}
