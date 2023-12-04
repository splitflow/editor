<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer/svelte'
    import { type SpacerNode, createParagraphBlock, createListItemBlock } from '../../document'
    import { EditorModule } from '../../editor-module'
    import { activateFlushVoid } from '../../extensions/flush'
    import { createUnselect } from '../../stores/document/selection'

    const style = createStyle('Spacer')

    const editor = getContext<EditorModule>(EditorModule)
    const { selection } = editor.stores

    export let block: SpacerNode
    export const getElement = () => element
    let element: HTMLElement

    const unselect = createUnselect()
    const flushExtension = activateFlushVoid(editor)

    $: flushExtension.block = block

    $: unselect($selection, block, () => {
        const prompt = element.textContent
        if (prompt !== '') {
            editor.replace(block, createParagraphBlock(prompt), { select: false })
        }
    })

    let prompt: string

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

    export function paste(event: ClipboardEvent) {
        const text = event.clipboardData.getData('text/plain')
        prompt = element.textContent + text

        if (prompt.startsWith('1. ')) {
            event.preventDefault()
            editor.replace(block, createListItemBlock(prompt.slice(3), true))
            return true
        }
        if (prompt.startsWith('- ')) {
            event.preventDefault()
            editor.replace(block, createListItemBlock(prompt.slice(2), false))
            return true
        }
        if (!'1. '.startsWith(prompt) && !'- '.startsWith(prompt)) {
            event.preventDefault()
            editor.replace(block, createParagraphBlock(prompt))
            return true
        }
    }
</script>

<p data-sf-block-id={block.blockId} class={style.root()} bind:this={element}>
    <br />
</p>
