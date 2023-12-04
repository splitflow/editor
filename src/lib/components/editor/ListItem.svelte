<svelte:options immutable={true} />

<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer/svelte'
    import { EditorModule } from '../../editor-module'
    import {
        createListItemBlock,
        createParagraphBlock,
        createSpacerBlock,
        type ListItemNode
    } from '../../document'
    import { editableMarkdown } from '../../markdown'
    import { isSelectionCollapsedAtEnd, isSelectionCollapsedAtStart } from '../../dom'
    import { activateFlushMarkdown } from '../../extensions/flush'
    import { activateFormat } from '../../extensions/format'

    const style = createStyle('ListItem')

    const editor = getContext<EditorModule>(EditorModule)

    export let block: ListItemNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    const flushExtension = activateFlushMarkdown(editor)
    const formatExtension = activateFormat(editor, style)

    $: flushExtension.element = element
    $: flushExtension.block = block
    $: formatExtension.element = element
    $: formatExtension.block = block

    export function keydown(event: KeyboardEvent) {
        if (event.key === 'Backspace') {
            if (isSelectionCollapsedAtStart(element)) {
                event.preventDefault()

                if (element.textContent === '') {
                    editor.replace(block, createSpacerBlock())
                } else {
                    editor.swap([block], createParagraphBlock())
                }
                return true
            }
        }

        if (event.key === 'Enter') {
            event.preventDefault()

            if (isSelectionCollapsedAtStart(element)) {
                editor.insert(createListItemBlock('', block.ordered), { before: block })
            } else if (isSelectionCollapsedAtEnd(element)) {
                editor.insert(createListItemBlock('', block.ordered), { after: block })
            } else {
                editor.split(block)
            }
            return true
        }
    }
</script>

<li
    data-sf-block-id={block.blockId}
    class={style.root()}
    bind:this={element}
    use:editableMarkdown={{ markdown: block.markdown, style }}
>
    <br />
</li>
