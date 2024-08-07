<script lang="ts">
    import { createStyle, createConfig } from '@splitflow/designer'
    import { svg }  from '@splitflow/designer/svelte'
    import { getContext } from 'svelte'
    import { EditorModule } from '../../editor-module'
    import {
        createHeaderBlock,
        createImageBlock,
        createParagraphBlock,
        isNotVoidNode,
        key
    } from '../../document'
    import { readFormat } from '../../stores/document/format'
    import { readBlockType, readSelection } from '../../stores/document/selection'
    import { activateComponentExtensions, toolbarExtension } from '../../extension'

    const editor = getContext<EditorModule>(EditorModule)
    const { selection, format, fragments } = editor.stores

    const style = createStyle('Toolbar', editor.designer)
    const config = createConfig('Toolbar', editor.designer)

    const extensions = activateComponentExtensions(
        editor.extension.match(toolbarExtension('main')),
        { editor, style, config }
    )

    $: formatData = readFormat($format)
    $: blockTypeData = readBlockType($selection, isNotVoidNode)

    function swapHeader() {
        if (blockTypeData.header) {
            editor.swap(readSelection($selection), createParagraphBlock())
        } else {
            editor.swap(readSelection($selection), createHeaderBlock())
        }
    }

    function uploadImage() {
        editor.openFileDialog('image/*', (file: File) => {
            if (!file) return

            const imageBlock = createImageBlock(URL.createObjectURL(file))
            editor.insert(imageBlock)
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
</script>

<menu class={style.root()}>
    {#if $config.bold.enabled()}
        <button
            class={style.button({ bold: true, active: formatData.B })}
            on:mousedown|preventDefault={() => editor.format('B', formatData.B)}
        >
            <svg
                use:svg={$config.bold.svg(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>'
                )}
            />
        </button>
    {/if}
    {#if $config.italic.enabled()}
        <button
            class={style.button({ italic: true, active: formatData.I })}
            on:mousedown|preventDefault={() => editor.format('I', formatData.I)}
        >
            <svg
                use:svg={$config.italic.svg(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>'
                )}
            />
        </button>
    {/if}
    {#if $config.typography.enabled()}
        <button
            class={style.button({ typography: true, active: blockTypeData.header })}
            on:mousedown|preventDefault={() => swapHeader()}
        >
            <svg
                use:svg={$config.typography.svg(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>'
                )}
            />
        </button>
    {/if}
    {#if $config.image.enabled()}
        <button
            class={style.button({ image: true })}
            on:mousedown|preventDefault={() => uploadImage()}
        >
            <svg
                use:svg={$config.image.svg(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
                )}
            />
        </button>
    {/if}
    {#each $extensions as { extension, activation }}
        <button
            class={style.button({ [extension.name]: true })}
            on:mousedown|preventDefault={() => activation.run()}
        >
            <svg use:svg={$config[extension.name].svg(extension.svg)} />
        </button>
    {/each}
</menu>
