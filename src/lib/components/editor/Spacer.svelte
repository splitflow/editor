<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer/svelte'
    import {
        type SpacerNode,
        createParagraphBlock,
        isEqual,
        createListItemBlock
    } from '../../document'
    import { EditorModule, flush } from '../../editor-module'
    import { cloneNode } from '../../dom'

    const style = createStyle('Spacer')

    export let block: SpacerNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    const editor = getContext<EditorModule>(EditorModule)

    let prompt: string

    flush((action) => {
        if (isEqual(action.block, block)) {
            const fragment = cloneNode(element, action)
            return { block: { ...block, text: fragment.textContent } }
        }
    })

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
</script>

<p bind:this={element} class={style.root()}>
    <br />
</p>
