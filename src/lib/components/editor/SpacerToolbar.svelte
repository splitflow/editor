<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle, createConfig } from '@splitflow/designer/svelte'
    import { svg } from '@splitflow/designer/svelte'
    import {
        key,
        createImageBlock,
        type SpacerNode,
        createParagraphBlock,
        isEqual,
        createListItemBlock
    } from '../../document'
    import { EditorModule, flush } from '../../editor-module'
    import { cloneNode } from '../../dom'

    const style = createStyle('SpacerToolbar')
    const config = createConfig('SpacerToolbar')

    export let block: SpacerNode
    let element: HTMLElement

    export function getElement() {
        return element
    }

    const editor = getContext<EditorModule>(EditorModule)
    const { selection, fragments } = editor.stores

    let prompt: string
    $: selected = !!$selection?.[key(block)]
    $: open = selected && !prompt
    $: expanded = !open ? false : expanded ?? false

    function uploadImage() {
        editor.openFileDialog('image/*', (file: File) => {
            if (!file) return

            const imageBlock = createImageBlock(URL.createObjectURL(file))
            editor.replace(block, imageBlock)
            editor.upload(file).then(
                (src) => {
                    fragments.push({ [key(imageBlock)]: { src } })
                    URL.revokeObjectURL(imageBlock.src)
                },
                () => {
                    fragments.push({ [key(imageBlock)]: null })
                    URL.revokeObjectURL(imageBlock.src)
                }
            )
        })
    }

    flush((action) => {
        if (isEqual(action.block, block)) {
            open = false // we should have select / unselect callbacks to be more explicit

            const fragment = cloneNode(element, action)
            return { block: { ...block, text: fragment.textContent } }
        }
    })

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
</script>

<div class={style.root()}>
    {#if open}
        <i class={style.toggle()} contenteditable="false">
            <button class={style.button({ toggle: true })} on:click={() => (expanded = !expanded)}>
                <svg
                    use:svg={$config.toggle.svg(
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>'
                    )}
                />
            </button>
        </i>
    {/if}
    {#if expanded}
        <menu class={style.menu()} contenteditable="false">
            {#if $config.image.enabled()}
                <button class={style.button({ image: true })} on:click={() => uploadImage()}>
                    <svg
                        use:svg={$config.image.svg(
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
                        )}
                    />
                </button>
            {/if}
            {#if $config.list.enabled()}
                <button
                    class={style.button({ list: true })}
                    on:click={() => editor.replace(block, createListItemBlock('', true))}
                >
                    <svg
                        use:svg={$config.list.svg(
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
                        )}
                    />
                </button>
            {/if}
        </menu>
    {/if}
    <p data-sf-block-id={block.blockId} contenteditable={!expanded} bind:this={element}>
        <br />
    </p>
</div>

<style>
    div {
        position: relative;
    }

    i {
        position: absolute;
        top: 50%;
        left: 0;
        transform: translate(-100%, -50%);
    }

    menu {
        position: absolute;
        top: 50%;
        left: 0;
        transform: translate(0, -50%);
    }
</style>
