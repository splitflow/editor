<svelte:options immutable={true} />

<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer/svelte'
    import { EditorModule, flush, format } from '../../editor-module'
    import { windowSelectionRange } from '../../windowselection'
    import {
        createListItemBlock,
        createParagraphBlock,
        createSpacerBlock,
        isEqual,
        key,
        type ListItemNode
    } from '../../document'
    import { MarkdownEmitter, editableMarkdown } from '../../markdown'
    import {
        getRangeWrappers,
        unwrapRange,
        wrapRange,
        cloneNode,
        getBoundedSelectionRange,
        isSelectionCollapsedAtEnd,
        isSelectionCollapsedAtStart
    } from '../../dom'

    const style = createStyle('ListItem')

    const editor = getContext<EditorModule>(EditorModule)
    const { format: formatStore } = editor.stores

    const emitter = new MarkdownEmitter()

    export let block: ListItemNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    $: {
        console.log('LI BLOCK update' + block.markdown)
    }

    windowSelectionRange(() => {
        const range = getBoundedSelectionRange(element)
        if (range) {
            formatStore.push({
                [key(block)]: getRangeWrappers(range, element, { B: false, I: false })
            })
            return
        }
        formatStore.clear(key(block))
    })

    format((action) => {
        const range = getBoundedSelectionRange(element)
        if (range) {
            if (action.off) {
                unwrapRange(range, element, action.tagName)
            } else {
                wrapRange(range, element, action.tagName, style[action.className]())
            }
            return {}
        }
    })

    flush((action) => {
        if (isEqual(action.block, block)) {
            const fragment = cloneNode(element, action)
            const markdown = emitter.emitMarkdown(fragment)
            if (action.change && markdown === block.markdown) {
                return { block: null }
            }
            return { block: { ...block, markdown } }
        }
    })

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
    class={style.root()}
    bind:this={element}
    use:editableMarkdown={{ markdown: block.markdown, style }}
>
    <br />
</li>
