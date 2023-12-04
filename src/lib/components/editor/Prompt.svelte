<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import { type PromptNode } from '../../document'
    import { isSelectionCollapsedAtStart } from '../../dom'
    import { getContext } from 'svelte'
    import { EditorModule } from '../../editor-module'
    import { createUnselect } from '../../stores/document/selection'

    const style = createStyle('Prompt')

    const editor = getContext<EditorModule>(EditorModule)
    const { selection } = editor.stores

    export let block: PromptNode
    export const getElement = () => element
    let element: HTMLElement

    const unselect = createUnselect()
    let hasPrompt = false

    $: unselect($selection, block, () => editor.shadow({ clear: true }))

    export function keydown(event: KeyboardEvent) {
        if (event.key === 'Backspace') {
            if (isSelectionCollapsedAtStart(element)) {
                event.preventDefault()

                const { block } = editor.shadow({ clear: true })
                editor.select(block, { afterUpdate: true })
                return true
            }
        }

        if (event.key === 'Enter') {
            event.preventDefault()

            const prompt = element.textContent
            if (prompt) {
                block.run(prompt)
            } else {
                const { block } = editor.shadow({ clear: true })
                editor.select(block, { afterUpdate: true })
            }
            return true
        }

        requestAnimationFrame(() => {
            // element might be undefined if block was deleted
            hasPrompt = element?.textContent !== ''
        })
    }

    export function paste(event: ClipboardEvent) {
        if (!element.textContent) {
            event.preventDefault()

            const prompt = event.clipboardData.getData('text/plain')
            block.run(prompt)
            return true
        }

        requestAnimationFrame(() => {
            // element might be undefined if block was deleted
            hasPrompt = element?.textContent !== ''
        })
    }
</script>

<div class={style.root()}>
    <p data-sf-block-id={block.blockId} bind:this={element} class={style.prompt()}>
        <br />
    </p>
    {#if !hasPrompt}
        <span class={style.placeholder()} contenteditable="false">{block.placeholder}</span>
    {/if}
</div>

<style>
    div {
        position: relative;
    }

    span {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
    }
</style>
