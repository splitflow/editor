<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import type { EmbedNode } from '.'

    const style = createStyle('Embed')

    export const isVoid = true
    export let block: EmbedNode
    let element: HTMLElement

    $: console.log(block)

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

<div data-sf-block-id={block.blockId} draggable="true" bind:this={element}>
    <span><br /></span>
    <figure class={style.root(rootVariant(block))} contenteditable="false">
        <div class={`embed ${style.embed()}`} style={embedStyle(block)}>
            {#if block.html?.startsWith('<iframe')}
                {@html block.html}
            {:else if block.html}
                <iframe title="" frameBorder="0" srcdoc={block.html} />
            {/if}
        </div>
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

    .embed {
        aspect-ratio: 16 / 9;
    }

    .embed > :global(iframe) {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
