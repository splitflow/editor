<svelte:options immutable={true} />

<script lang="ts">
    import { createStyle } from '@splitflow/designer'
    import { type HeaderNode } from '../../document'
    import { EditorModule } from '../../editor-module'
    import { editableText } from '../../text'
    import { activateFlushText } from '../../extensions/flush'
    import { getContext } from 'svelte'

    const editor = getContext<EditorModule>(EditorModule)

    const style = createStyle('Header', editor.designer)

    export let block: HeaderNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    const flushExtension = activateFlushText(editor)

    $: flushExtension.element = element
    $: flushExtension.block = block
</script>

<h1
    data-sf-block-id={block.blockId}
    class={style.root()}
    bind:this={element}
    use:editableText={block.text}
>
    <br />
</h1>
