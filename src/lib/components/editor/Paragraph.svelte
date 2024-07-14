<svelte:options immutable={true} />

<script lang="ts">
    import { getContext } from 'svelte'
    import { createConfig, createStyle } from '@splitflow/designer'
    import { EditorModule } from '../../editor-module'
    import { createSpacerBlock, type ParagraphNode } from '../../document'
    import { editableMarkdown } from '../../markdown'
    import { activateComponentExtensions, blockExtension } from '../../extension'
    import { activateFormat } from '../../extensions/format'
    import { activateFlushMarkdown } from '../../extensions/flush'

    const editor = getContext<EditorModule>(EditorModule)

    const style = createStyle('Paragraph', editor.designer)
    const config = createConfig('Paragraph', editor.designer)

    export let block: ParagraphNode
    export const getElement = () => element
    let element: HTMLElement

    const flushExtension = activateFlushMarkdown(editor)
    const formatExtension = activateFormat(editor, style)
    const extensions = activateComponentExtensions(
        editor.extension.match(blockExtension('paragraph')),
        { editor, style, config },
        true
    )

    $: flushExtension.element = element
    $: flushExtension.block = block
    $: formatExtension.element = element
    $: formatExtension.block = block
    $: $extensions.forEach(({ activation }) => (activation.element = element))

    export function keydown(event: KeyboardEvent) {
        $extensions.forEach(({ activation }) => activation.keydown(event))

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
