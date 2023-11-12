<svelte:options immutable={true} />

<script lang="ts">
    import { getContext, onMount } from 'svelte'
    import { createConfig, createStyle } from '@splitflow/designer/svelte'
    import { EditorModule, flush, format } from '../../editor-module'
    import { windowSelectionRange } from '../../windowselection'
    import { createSpacerBlock, isEqual, key, type ParagraphNode } from '../../document'
    import { MarkdownEmitter, editableMarkdown } from '../../markdown'
    import {
        getRangeWrappers,
        unwrapRange,
        wrapRange,
        cloneNode,
        getBoundedSelectionRange
    } from '../../dom'
    import { formatData } from '../../stores/document/format'
    import type { Behaviour } from '../../behaviours/highlight'
    import highlight, { createBehaviourManager } from '../../behaviours/highlight'
    import type { Config, Style } from '@splitflow/designer'

    const style = createStyle('Paragraph')
    const config = createConfig('Paragraph')

    const editor = getContext<EditorModule>(EditorModule)
    const { format: formatStore } = editor.stores

    const emitter = new MarkdownEmitter()

    export let block: ParagraphNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    let _highlight = createBehaviourManager(highlight, style, editor)

    $: {
        $config.highlight.enabled() ? _highlight.update(element, $config) : _highlight.destroy()
    }

    $: {
        console.log('P BLOCK update' + block.markdown)
    }

    windowSelectionRange(() => {
        const range = getBoundedSelectionRange(element)
        if (range) {
            formatStore.push({
                [key(block)]: formatData(getRangeWrappers(range, element))
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
        _highlight?.keydown?.(event)

        if (event.key === 'Backspace') {
            requestAnimationFrame(() => {
                // element might be undefined if paragraph was deleted
                if (element?.textContent === '') {
                    editor.replace(block, createSpacerBlock())
                }
            })
            return false
        }
    }
</script>

<p
    data-sf-block-id={block.blockId}
    class={style.root()}
    bind:this={element}
    use:editableMarkdown={{ markdown: block.markdown, style }}
>
    <br />
</p>
