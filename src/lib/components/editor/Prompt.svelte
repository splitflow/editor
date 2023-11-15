<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import { type PromptNode } from '../../document'
    import { isSelectionCollapsedAtStart } from '../../dom'
    import { getContext } from 'svelte'
    import { EditorModule } from '../../editor-module'


    const style = createStyle('Prompt')

    const editor = getContext<EditorModule>(EditorModule)

    export let block: PromptNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    let hasPrompt = false

    export function keydown(event: KeyboardEvent) {

        if (event.key === 'Backspace') {
            console.log('BACK-')
            if (isSelectionCollapsedAtStart(element)) {
                event.preventDefault()
                console.log('START')
                console.log(element.textContent)
                console.log(element.textContent.length)
                if (element.textContent === '') {
                    console.log('CLEAR')
                    editor.shadow(undefined, { clear: true })
                } else {
                    //editor.swap([block], createParagraphBlock())
                }
                return true
            }
        }

        if (event.key.length == 1 && !event.metaKey && !event.ctrlKey) {
            hasPrompt = true
        }

        if (event.key === 'Backspace') {
            console.log(element.textContent)
            hasPrompt = element.textContent.length > 1
        }

        if (event.key === 'Enter') {
            event.preventDefault()
            const prompt = element.textContent
            block.run(prompt, block)
            return true
        }
    }
</script>

<p data-sf-block-id={block.blockId} class={style.root()} bind:this={element}>
    <br />
    {#if !hasPrompt}
        <span contenteditable="false">{block.placeholder}</span>
    {/if}
</p>

<style>
    p {
        position: relative;
    }

    span {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
    }
</style>
