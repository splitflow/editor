<script lang="ts">
	import { createStyle } from '@splitflow/designer'
	import type { EmbedNode } from '.'
	import { getContext } from 'svelte'
	import { EditorModule } from '../../editor-module'
	import { ViewerModule } from '../../viewer-module'
	import { isSelected } from '../../stores/document/selection'
	import { activateFlushVoid } from '../../extensions/flush'

	const editor = getContext<EditorModule>(EditorModule)
	const viewer = getContext<ViewerModule>(ViewerModule)
	const { selection } = editor?.stores ?? {}

	const style = createStyle('Embed', (editor ?? viewer).designer)

	export const isVoid = true
	export let block: EmbedNode
	export const getElement = () => element
	let element: HTMLElement

	const flushExtension = activateFlushVoid(editor)

	$: flushExtension && (flushExtension.block = block)
	$: selected = editor ? isSelected($selection, block) : false

	function rootVariant(block: EmbedNode, selected: boolean) {
		const variant = { selected }
		if (block.provider) {
			variant[block.provider] = true
		}
		return variant
	}

	function withStyle(html: string, style: string) {
		return `<iframe style="${style}" ${html.slice(7)}`
	}
</script>

<div data-sf-block-id={block.blockId} style="position: relative;" bind:this={element}>
	<span style="position: absolute; display: block; max-height: 0;"><br /></span>
	<figure class={style.root(rootVariant(block, selected))} contenteditable="false">
		<div class={style.embed()} style="position: relative;">
			{#if block.html?.startsWith('<iframe')}
				{@html withStyle(block.html, 'display: block; width: 100%; height: 100%;')}
			{:else if block.html}
				<iframe
					title=""
					frameBorder="0"
					srcdoc={block.html}
					style="display: block; width: 100%; height: 100%;"
				/>
			{/if}
		</div>
		{#if editor}
			<span style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 100;" />
		{/if}
	</figure>
</div>
