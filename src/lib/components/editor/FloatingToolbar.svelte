<script lang="ts">
    import { createStyle, createConfig } from '@splitflow/designer/svelte'
    import { svg } from '@splitflow/designer/svelte'
    import { getContext } from 'svelte'
    import { EditorModule } from '../../editor-module'
    import { readFormat } from '../../stores/document/format'
    import { createHeaderBlock, createParagraphBlock, isNotVoidNode } from '../../document'
    import { readBlockType, readSelection } from '../../stores/document/selection'
    import { rangeTooltip } from '../toolkit/actions'

    const style = createStyle('FloatingToolbar')
    const config = createConfig('FloatingToolbar')

    const editor = getContext<EditorModule>(EditorModule)
    const { selection, format } = editor.stores

    $: formatData = readFormat($format)
    $: blockTypeData = readBlockType($selection, isNotVoidNode)

    let open = false

    function swapHeader() {
        if (blockTypeData.header) {
            editor.swap(readSelection($selection), createParagraphBlock())
        } else {
            editor.swap(readSelection($selection), createHeaderBlock())
        }
    }

    export function mousedown(event: MouseEvent) {
        open = false
    }

    export function mouseup(event: MouseEvent) {
        const windowSelection = window.getSelection()
        const range = windowSelection.getRangeAt(0)
        open = !range?.collapsed ?? false
    }
</script>

{#if open}
    <menu class={style.root()} use:rangeTooltip>
        {#if $config.typography.enabled()}
            <button
                class={style.button({ typography: true, active: blockTypeData.header })}
                on:mousedown|preventDefault|stopPropagation={() => swapHeader()}
            >
                <svg
                    use:svg={$config.typography.svg(
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>'
                    )}
                />
            </button>
        {/if}
        {#if $config.bold.enabled()}
            <button
                class={style.button({ bold: true, active: formatData.B })}
                on:mousedown|preventDefault|stopPropagation={() => editor.format('B', formatData.B)}
            >
                <svg
                    use:svg={$config.bold.svg(
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>'
                    )}
                />
            </button>
        {/if}
    </menu>
{/if}
