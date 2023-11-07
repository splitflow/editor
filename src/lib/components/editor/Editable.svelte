<script lang="ts">
    import { getContext } from 'svelte'
    import { first } from '@splitflow/core/utils'
    import { createConfig, createStyle } from '@splitflow/designer/svelte'
    import { EditorModule, select, snapshotSelection } from '../../editor-module'
    import {
        key,
        isParagraphNode,
        isImageNode,
        isHeaderNode,
        data,
        parseKey,
        isSpacerNode,
        createSpacerBlock,
        isListItemNode
    } from '../../document'
    import {
        findAncestorRootChild,
        isSelectionCollapsedAtEnd,
        isSelectionCollapsedAtStart,
        setSelectionCollapsed
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
    import { createSelectionSnapshot } from '../../selection-snapshot'

    const style = createStyle('Editable')
    const config = createConfig('Editable')

    const editor = getContext<EditorModule>(EditorModule)
    const { fragments, document, selection, dragndrop } = editor.stores

    $: console.log($document)
    let element: HTMLElement

    const registry = createDocumentRegistry(document)
    $: registry2 = $registry

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
                            console.log('WSC')
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
            console.log('Select')
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
        const record = action.block ? $registry.getRecord(action.block) : undefined
        return { snapshot: createSelectionSnapshot(record?.element ?? element/*, action*/) }
    })

    function keydown(event: KeyboardEvent) {
        if (
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
            console.log('BACK')
            if (isSelectionCollapsedAtStart(record.element)) {
                event.preventDefault()
                console.log('COLLAPSED')
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

    function getSelectedBlocks() {
        return [...$registry.records()].filter((r) => $selection[key(r.block)]).map((r) => r.block)
    }

    function getSelectedRecords() {
        return [...$registry.records()].filter((r) => $selection[key(r.block)])
    }
</script>

<div
    contenteditable="true"
    class={style.root()}
    bind:this={element}
    on:keydown={keydown}
    on:dragstart={dragstart}
    on:dragenter={dragenter}
    on:dragover={dragover}
    on:drop={drop}
>
    {#each registry2.read() as record (record.key)}
        {#if record instanceof RecordGroup}
            {@const group = record}

            {#if group.ordered}
                <ol>
                    {#each group.records as record (record.key)}
                        {@const block = record.block}
                        {#if isListItemNode(block)}
                            <ListItem {block} bind:this={record.component} />
                        {/if}
                    {/each}
                </ol>
            {:else}
                <ul>
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

            {#if isParagraphNode(block)}
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
            {/if}
        {/if}
    {/each}
</div>

<style>
    div {
        overflow-y: auto;
    }

    ol,
    ul {
        list-style: revert;
        list-style-position: inside;
    }
</style>
