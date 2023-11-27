<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import type { EmbedNode } from '.'
    import { getContext } from 'svelte'
    import { EditorModule } from '../../editor-module'
    import { isSelected } from '../../stores/document/selection'
    import { activateFlushVoid } from '../../extensions/flush'

    const style = createStyle('Embed')

    const editor = getContext<EditorModule>(EditorModule)
    const { selection } = editor?.stores ?? {}

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
</script>

<div data-sf-block-id={block.blockId} bind:this={element} class:editor>
    <span><br /></span>
    <figure class={style.root(rootVariant(block, selected))} contenteditable="false">
        <div class={`embed ${style.embed()}`}>
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
        position: relative;
    }

    .embed > :global(iframe) {
        display: block;
        width: 100%;
        height: 100%;
    }

    .editor .embed::after {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
        content: ' ';
    }
</style>
