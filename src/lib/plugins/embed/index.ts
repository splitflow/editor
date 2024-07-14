import type { EditorModule } from '../../editor-module'
import type {
	EditableExtension,
	ExtensionMananger,
	ToolbarExtension,
	ViewerExtension
} from '../../extension'
import Embed from './Embed.svelte'
import { resolverWithProviders, type ResolverResult } from './resolver'

const browser = typeof window !== 'undefined'

export interface EmbedNode {
	blockType: 'embed'
	blockId: string
	position: number
	url: string
	provider?: string
	html?: string
	width?: number
	height?: number
}

export function createEmbedBlock(url: string): EmbedNode {
	return {
		blockType: 'embed',
		blockId: crypto.randomUUID(),
		position: 10e8,
		url
	}
}

export default function embed(
	resolver?:
		| ('youtube' | 'vimeo' | 'twitter' | 'tiktok' | 'spotify')[]
		| ((url: string) => Promise<ResolverResult>)
) {
	const resolve = typeof resolver === 'function' ? resolver : resolverWithProviders(resolver)

	function activate(editor: EditorModule) {
		return {
			run() {
				editor.prompt('Copy a youtube or other embed link', (prompt) => {
					resolve(prompt).then(
						({ html, width, height, provider_name }) => {
							const embedBlock = createEmbedBlock(prompt)
							embedBlock.html = html
							embedBlock.width = width
							embedBlock.height = height
							embedBlock.provider = provider_name?.toLowerCase()

							editor.shadow({ replace: embedBlock, flush: true })
						},
						(error: Error) => {
							const { block } = editor.shadow({ clear: true })
							editor.select(block, { afterUpdate: true })
							console.warn(error.message)
						}
					)
				})
			}
		}
	}

	return (extension: ExtensionMananger) => {
		const toolbarExtension: ToolbarExtension = {
			type: 'toolbar',
			name: 'embed',
			svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
			activate
		}
		extension.addExtension(toolbarExtension)

		if (browser) {
            // the Embed component is not compiled for SSR
            // so we add the extension only on client side
            // one solution would be to have a pure JS solution for plugins
			const editableExtension: EditableExtension = {
				type: 'editable',
				name: 'embed',
				blockType: 'embed',
				component: Embed
			}
			extension.addExtension(editableExtension)

			const viewerExtension: ViewerExtension = {
				type: 'viewer',
				name: 'embed',
				blockType: 'embed',
				component: Embed
			}
			extension.addExtension(viewerExtension)
		}
	}
}
