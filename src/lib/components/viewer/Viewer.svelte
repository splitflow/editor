<script lang="ts">
    import { SplitflowDesigner, createStyle } from '@splitflow/designer'
    import { setContext } from 'svelte'
    import {
        isHeaderNode,
        isImageNode,
        isListItemNode,
        isParagraphNode,
        isSpacerNode
    } from '../../document'
    import { RecordGroup, createDocumentRegistry } from '../../registry'
    import ListItem from './ListItem.svelte'
    import Paragraph from './Paragraph.svelte'
    import Header from './Header.svelte'
    import Image from './Image.svelte'
    import Spacer from './Spacer.svelte'
    import { createViewer, ViewerModule } from '../../viewer-module'
    import type { EditorModule } from '../../editor-module'

    export let module: ViewerModule | EditorModule = createViewer()

    setContext(ViewerModule, module)
    setContext(SplitflowDesigner, module.designer)

    const style = createStyle('Viewer', module.designer)

    const { document } = module.stores

    const registry = createDocumentRegistry(document)
    $: registry2 = $registry
</script>

<div class={`sf-css-reset ${style.root()}`}>
    {#each registry2.read() as record (record.key)}
        {#if record instanceof RecordGroup}
            {@const group = record}

            {#if group.ordered}
                <ol>
                    {#each group.records as record (record.key)}
                        {@const block = record.block}
                        {#if isListItemNode(block)}
                            <ListItem {block} />
                        {/if}
                    {/each}
                </ol>
            {:else}
                <ul>
                    {#each group.records as record (record.key)}
                        {@const block = record.block}
                        {#if isListItemNode(block)}
                            <ListItem {block} />
                        {/if}
                    {/each}
                </ul>
            {/if}
        {:else}
            {@const block = record.block}

            {#if isParagraphNode(block)}
                <Paragraph {block} />
            {:else if isHeaderNode(block)}
                <Header {block} />
            {:else if isImageNode(block)}
                <Image {block} />
            {:else if isSpacerNode(block)}
                <Spacer />
            {/if}
        {/if}
    {/each}
</div>

<style>
    ol,
    ul {
        list-style: revert;
        list-style-position: inside;
    }
</style>
