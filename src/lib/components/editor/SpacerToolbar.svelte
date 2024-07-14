<script lang="ts">
	import { getContext } from 'svelte'
	import { createStyle, createConfig } from '@splitflow/designer'
	import { svg } from '@splitflow/designer/svelte'
	import {
		key,
		createImageBlock,
		type SpacerNode,
		createParagraphBlock,
		createListItemBlock
	} from '../../document'
	import { EditorModule } from '../../editor-module'
	import { activateComponentExtensions, toolbarExtension } from '../../extension'
	import { activateFlushVoid } from '../../extensions/flush'
	import { createUnselect } from '../../stores/document/selection'

	const editor = getContext<EditorModule>(EditorModule)
	const { selection, fragments } = editor.stores

	const style = createStyle('SpacerToolbar', editor.designer)
	const config = createConfig('SpacerToolbar', editor.designer)

	export let block: SpacerNode
	export const getElement = () => element
	let element: HTMLElement

	const unselect = createUnselect()
	const flushExtension = activateFlushVoid(editor)
	const extensions = activateComponentExtensions(
		editor.extension.match(toolbarExtension('spacer')),
		{ editor, style, config }
	)

	let prompt: string

	$: flushExtension.block = block
	$: selected = !!$selection?.[key(block)]
	$: open = selected && !prompt
	$: expanded = !open ? false : expanded ?? false

	$: unselect($selection, block, () => {
		const prompt = element.textContent
		if (prompt !== '') {
			editor.replace(block, createParagraphBlock(prompt), { select: false })
		}
	})

	function uploadImage() {
		editor.openFileDialog('image/*', (file: File) => {
			if (!file) return

			const imageBlock = createImageBlock(URL.createObjectURL(file))
			editor.replace(block, imageBlock)
			editor.upload(file).then(
				(src) => {
					fragments.push({ [key(imageBlock)]: { src } })
					URL.revokeObjectURL(imageBlock.src)
				},
				() => {
					fragments.push({ [key(imageBlock)]: null })
					URL.revokeObjectURL(imageBlock.src)
				}
			)
		})
	}

	export function keydown(event: KeyboardEvent) {
		if (event.key.length == 1 && !event.metaKey && !event.ctrlKey) {
			prompt = element.textContent + event.key

			if (prompt === '1. ') {
				event.preventDefault()
				editor.replace(block, createListItemBlock('', true))
				return true
			}
			if (prompt === '- ') {
				event.preventDefault()
				editor.replace(block, createListItemBlock('', false))
				return true
			}
			if (!'1. '.startsWith(prompt) && !'- '.startsWith(prompt)) {
				event.preventDefault()
				editor.replace(block, createParagraphBlock(prompt))
				return true
			}
		}
	}

	export function paste(event: ClipboardEvent) {
		const text = event.clipboardData.getData('text/plain')
		prompt = element.textContent + text

		if (prompt.startsWith('1. ')) {
			event.preventDefault()
			editor.replace(block, createListItemBlock(prompt.slice(3), true))
			return true
		}
		if (prompt.startsWith('- ')) {
			event.preventDefault()
			editor.replace(block, createListItemBlock(prompt.slice(2), false))
			return true
		}
		if (!'1. '.startsWith(prompt) && !'- '.startsWith(prompt)) {
			event.preventDefault()
			editor.replace(block, createParagraphBlock(prompt))
			return true
		}
	}
</script>

<div class={style.root()} style="position: relative;">
	{#if open}
		<i
			class={style.toggle()}
			style="position: absolute; top: 50%; left: 0; transform: translate(-100%, -50%);"
			contenteditable="false"
		>
			<button class={style.button({ toggle: true })} on:click={() => (expanded = !expanded)}>
				<svg
					use:svg={$config.toggle.svg(
						'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>'
					)}
				/>
			</button>
		</i>
	{/if}
	{#if expanded}
		<menu
			class={style.menu()}
			style="position: absolute; top: 50%; left: 0; transform: translate(0, -50%);"
			contenteditable="false"
		>
			{#if $config.image.enabled()}
				<button class={style.button({ image: true })} on:click={() => uploadImage()}>
					<svg
						use:svg={$config.image.svg(
							'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
						)}
					/>
				</button>
			{/if}
			{#if $config.list.enabled()}
				<button
					class={style.button({ list: true })}
					on:click={() => editor.replace(block, createListItemBlock('', true))}
				>
					<svg
						use:svg={$config.list.svg(
							'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
						)}
					/>
				</button>
			{/if}
			{#each $extensions as { extension, activation }}
				{#if $config[extension.name].enabled()}
					<button
						class={style.button({ [extension.name]: true })}
						on:mousedown|preventDefault={() => activation.run()}
					>
						<svg use:svg={$config[extension.name].svg(extension.svg)} />
					</button>
				{/if}
			{/each}
		</menu>
	{/if}
	<p data-sf-block-id={block.blockId} contenteditable={!expanded} bind:this={element}>
		<br />
	</p>
</div>
