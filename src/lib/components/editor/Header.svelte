<svelte:options immutable={true} />

<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import { cloneNode } from '../../dom'
    import { type HeaderNode, isEqual } from '../../document'
    import { flush } from '../../editor-module'
    import { editableText } from '../../text'

    export let block: HeaderNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    const style = createStyle('Header')

    flush((action) => {
        if (isEqual(action.block, block)) {
            const fragment = cloneNode(element, action)
            const text = fragment.textContent
            if (action.change && text === block.text) {
                return { block: null }
            }
            return { block: { ...block, text } }
        }
    })
</script>

<h1 class={style.root()} bind:this={element} use:editableText={block.text}>
    <br />
</h1>
