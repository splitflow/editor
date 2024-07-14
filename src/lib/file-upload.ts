import type { DialogAction, Error } from '@splitflow/app'

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

export interface UploadResult {
	url: string
	error?: Error
}

export async function uploadFile(action: UploadAction): Promise<UploadResult> {
	const url = await resizeImage(await readImage(action.file))
	return { url }
}

function readImage(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = reject
	})
}

const MAX_WIDTH = 1000
const MAX_HEIGHT = 1000

function resizeImage(src: string) {
	return new Promise<string>((resolve, reject) => {
		let img = new Image()
		img.src = src
		img.onload = () => {
			let canvas = document.createElement('canvas')
			let width = img.width
			let height = img.height

			if (width > height) {
				if (width > MAX_WIDTH) {
					height *= MAX_WIDTH / width
					width = MAX_WIDTH
				}
			} else {
				if (height > MAX_HEIGHT) {
					width *= MAX_HEIGHT / height
					height = MAX_HEIGHT
				}
			}
			canvas.width = width
			canvas.height = height
			let ctx = canvas.getContext('2d')
			ctx.drawImage(img, 0, 0, width, height)
			resolve(canvas.toDataURL('image/webp'))
		}
		img.onerror = reject
	})
}
