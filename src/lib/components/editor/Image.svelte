<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer/svelte'
    import { EditorModule } from '../../editor-module'
    import { type ImageNode } from '../../document'
    import { isSelected } from '../../stores/document/selection'
    import { activateFlushVoid } from '../../extensions/flush'

    const style = createStyle('Image')

    const editor = getContext<EditorModule>(EditorModule)
    const { selection } = editor.stores

    export const isVoid = true
    export let block: ImageNode
    export const getElement = () => element
    let element: HTMLElement

    const flushExtension = activateFlushVoid(editor)

    $: flushExtension.block = block
    $: selected = isSelected($selection, block)
</script>

<div data-sf-block-id={block.blockId} bind:this={element}>
    <span><br /></span>
    <figure class={style.root({ selected })} contenteditable="false">
        <img class={style.image()} draggable="true" alt="" src={block.src} />
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
</style>
