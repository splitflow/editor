<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer/svelte'
    import { EditorModule } from '../../editor-module'
    import { key, type ImageNode } from '../../document'

    export const isVoid = true
    export let block: ImageNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    const style = createStyle('Image')

    const editor = getContext<EditorModule>(EditorModule)
    const { selection } = editor.stores

    $: selected = !!$selection?.[key(block)]
</script>

<div
    data-sf-block-id={block.blockId}
    draggable="true"
    style={selected ? 'background: blue;' : ''}
    bind:this={element}
>
    <span><br /></span>
    <figure class={style.root()} contenteditable="false">
        <img draggable="false" alt="" src={block.src} />
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
