<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import type { EmbedNode } from '.'

    const style = createStyle('Embed')

    export const isVoid = true
    export let block: EmbedNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    function embedStyle(block: EmbedNode) {
        if (block.provider) {
            return `max-width: ${block.width}px;
                max-height: ${block.height}px;
                aspect-ratio: ${block.width / block.height}
            `
        }
        return ''
    }

    function rootVariant(block: EmbedNode) {
        if (block.provider) return { [block.provider]: true }
    }
</script>

<div
    data-sf-block-id={block.blockId}
    class={style.root(rootVariant(block))}
    draggable="true"
    bind:this={element}
>
    <span><br /></span>
    <figure class={style.embed()} style={embedStyle(block)} contenteditable="false">
        {#if block.html}
            {@html block.html}
        {/if}
    </figure>
</div>

<style>
    div {
        position: relative;
    }

    span {
        position: absolute;
        display: block;
        max-height: 0;
    }

    figure {
        aspect-ratio: 16 / 9;
    }

    figure > :global(iframe) {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
