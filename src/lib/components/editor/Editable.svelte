<script lang="ts">
	import { getContext, onMount } from 'svelte'
	import { first } from '@splitflow/core/utils'
	import { createConfig, createStyle } from '@splitflow/designer'
	import { EditorModule } from '../../editor-module'
	import {
		key,
		isParagraphNode,
		isImageNode,
		isHeaderNode,
		data,
		parseKey,
		isSpacerNode,
		createSpacerBlock,
		isListItemNode,
		isPromptNode
	} from '../../document'
	import {
		findAncestorRootChild,
		isSelectionCollapsedAtEnd,
		isSelectionCollapsedAtStart,
		setSelectionCollapsed,
		insertNode
	} from '../../dom'
	import { windowSelectionRange } from '../../windowselection'
	import { RecordGroup, createDocumentRegistry } from '../../registry'
	import { before, insertAfterPosition } from '../../stores/document/document'
	import Paragraph from './Paragraph.svelte'
	import Image from './Image.svelte'
	import Header from './Header.svelte'
	import SpacerToolbar from './SpacerToolbar.svelte'
	import ListItem from './ListItem.svelte'
	import Spacer from './Spacer.svelte'
	import { collapseSelectionSnapshot, createSelectionSnapshot } from '../../selection-snapshot'
	import { activateComponentExtensions, type EditableExtension } from '../../extension'
	import Prompt from './Prompt.svelte'
	import FloatingToolbar from './FloatingToolbar.svelte'
	import { select, snapshotSelection } from '../../editable'

	const editor = getContext<EditorModule>(EditorModule)
	const { fragments, document, selection, dragndrop } = editor.stores

	const style = createStyle('Editable', editor.designer)
	const config = createConfig('Editable', editor.designer)

	const extensions = activateComponentExtensions(
		editor.extension.get<EditableExtension>('editable'),
		{ editor, style, config }
	)

	let element: HTMLElement

	let floatingToolbar: FloatingToolbar

	const registry = createDocumentRegistry(document)
	$: registry2 = $registry

	onMount(() => {
		console.log('MM test')
	})

	windowSelectionRange((selectionRange) => {
		if (selectionRange.intersectsNode(element)) {
			const builder = selection.selectionBuilder()
			for (const record of $registry.records()) {
				if (selectionRange.intersectsNode(record.element)) {
					builder.select(record.block)
				} else {
					if (builder.unselect(record.block)) {
						const block = editor.flush(record.block, { change: true })
						if (block) {
							fragments.push({ [key(block)]: data(block) })
						}
					}
				}
			}
			builder.flush()
		} else {
			selection.clear()
		}
	})

	select((action) => {
		const record = $registry.getRecord(action.block)
		if (record?.element) {
			setSelectionCollapsed(record.element, action.atStart)
		} else {
			console.warn(
				`Attempting to select a block which is not registered. 
                Did you forget to use 'afterUpdate'`
			)
		}

		if (action.restoreAfterUpdate) {
			return { snapshot: createSelectionSnapshot(element) }
		}
		return {}
	})

	snapshotSelection((action) => {
		let snapshot = createSelectionSnapshot(element)
		if (action.collapsedAtStart) {
			snapshot = collapseSelectionSnapshot(snapshot, true)
		} else if (action.collapsedAtEnd) {
			snapshot = collapseSelectionSnapshot(snapshot)
		}

		return { snapshot }
	})

	function keydown(event: KeyboardEvent) {
		if (
			event.ctrlKey ||
			event.metaKey ||
			event.key === 'Control' ||
			event.key === 'Meta' ||
			event.key === 'Tab' ||
			event.key === 'Shift' ||
			event.key === 'ArrowLeft' ||
			event.key === 'ArrowRight' ||
			event.key === 'ArrowUp' ||
			event.key === 'ArrowDown'
		) {
			return
		}

		if (Object.keys($selection).length > 1) {
			// handle multi block selection
			editor.collapse(getSelectedBlocks())

			if (event.key === 'Backspace' || event.key === 'Enter') {
				event.preventDefault()
			}
			return
		}

		const record = first(getSelectedRecords())
		if (record.dispatchKeydown(event)) {
			// event has been handled by the block component
			return
		}

		if (event.key === 'Backspace') {
			const record = first(getSelectedRecords())

			if (record.isVoid) {
				event.preventDefault()
				editor.replace(record.block, createSpacerBlock())
				return
			}

			if (isSelectionCollapsedAtStart(record.element)) {
				event.preventDefault()

				const beforeBlock = before($document, record.block)
				if (!beforeBlock) {
					//skip
				} else if (isSpacerNode(beforeBlock)) {
					editor.remove(beforeBlock)
				} else if (isSpacerNode(record.block)) {
					editor.remove(record.block)
					editor.select(beforeBlock)
				} else {
					editor.merge(beforeBlock, record.block)
				}
				return
			}
		}

		if (event.key === 'Enter') {
			event.preventDefault()

			if (record.isVoid) {
				editor.insert(createSpacerBlock(), { after: record.block })
				return
			}

			if (isSelectionCollapsedAtStart(record.element)) {
				editor.insert(createSpacerBlock(), { before: record.block })
			} else if (isSelectionCollapsedAtEnd(record.element)) {
				editor.insert(createSpacerBlock(), { after: record.block })
			} else {
				const block = first(getSelectedBlocks())
				editor.breakline(block)
			}
			return
		}

		if (record.isVoid) {
			event.preventDefault()
			return
		}
	}

	function paste(event: ClipboardEvent) {
		event.preventDefault()

		if (Object.keys($selection).length > 1) {
			// multi block selection
			editor.collapse(getSelectedBlocks())

			const text = event.clipboardData.getData('text/plain')
			requestAnimationFrame(() => {
				// we need to wait for collapse after selection to occur
				insertNode(window.document.createTextNode(text))
			})
			return
		}

		const record = first(getSelectedRecords())
		if (record.dispatchPaste(event)) {
			// event has been handled by the block component
			return
		}

		const text = event.clipboardData.getData('text/plain')
		insertNode(window.document.createTextNode(text))
	}

	function dragstart(event: DragEvent) {
		const blockElement = findAncestorRootChild(event.target as HTMLElement, element)
		const { block } = $registry.findRecord(blockElement)
		event.dataTransfer.setData('x-sf-editor-block', key(block))
	}

	function dragenter(event: DragEvent) {
		const blockElement = findAncestorRootChild(event.target as HTMLElement, element)
		const record = $registry.findRecord(blockElement)
		dragndrop.setDropTarget(record?.block)
	}

	function dragover(event: DragEvent) {
		event.preventDefault()
	}

	function drop(event: DragEvent) {
		const dragBlock = parseKey(event.dataTransfer.getData('x-sf-editor-block'))
		const dropBlock = $dragndrop.target
		if (dragBlock && dropBlock) {
			fragments.push({
				[key(dragBlock)]: { position: insertAfterPosition($document, dropBlock) }
			})
		}
	}

	function mousedown(event: MouseEvent) {
		floatingToolbar?.mousedown(event)
	}

	function mouseup(event: MouseEvent) {
		floatingToolbar?.mouseup(event)
	}

	function getSelectedBlocks() {
		return [...$registry.records()].filter((r) => $selection[key(r.block)]).map((r) => r.block)
	}

	function getSelectedRecords() {
		return [...$registry.records()].filter((r) => $selection[key(r.block)])
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	contenteditable="true"
	class={style.root()}
	style="position: relative; overflow-y: auto;"
	bind:this={element}
	on:keydown={keydown}
	on:dragstart={dragstart}
	on:dragenter={dragenter}
	on:dragover={dragover}
	on:drop={drop}
	on:paste={paste}
	on:mousedown={mousedown}
	on:mouseup={mouseup}
>
	{#each registry2.read() as record (record.key)}
		{#if record instanceof RecordGroup}
			{@const group = record}

			{#if group.ordered}
				<ol style="list-style: revert; list-style-position: inside;">
					{#each group.records as record (record.key)}
						{@const block = record.block}
						{#if isListItemNode(block)}
							<ListItem {block} bind:this={record.component} />
						{/if}
					{/each}
				</ol>
			{:else}
				<ul style="list-style: revert; list-style-position: inside;">
					{#each group.records as record (record.key)}
						{@const block = record.block}
						{#if isListItemNode(block)}
							<ListItem {block} bind:this={record.component} />
						{/if}
					{/each}
				</ul>
			{/if}
		{:else}
			{@const block = record.block}
			{@const extension = $extensions.find(
				({ extension }) => extension.blockType === block.blockType
			)}

			{#if extension}
				<svelte:component
					this={extension.extension.component}
					{block}
					bind:this={record.component}
				/>
			{:else if isParagraphNode(block)}
				<Paragraph {block} bind:this={record.component} />
			{:else if isHeaderNode(block)}
				<Header {block} bind:this={record.component} />
			{:else if isImageNode(block)}
				<Image {block} bind:this={record.component} />
			{:else if isSpacerNode(block)}
				{#if $config.spacerToolbar.enabled()}
					<SpacerToolbar {block} bind:this={record.component} />
				{:else}
					<Spacer {block} bind:this={record.component} />
				{/if}
			{:else if isPromptNode(block)}
				<Prompt {block} bind:this={record.component} />
			{/if}
		{/if}
	{/each}
	{#if $config.floatingToolbar.enabled()}
		<FloatingToolbar bind:this={floatingToolbar} />
	{/if}
</div>
