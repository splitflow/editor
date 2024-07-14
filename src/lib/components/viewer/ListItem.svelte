<svelte:options immutable={true} />

<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer'
    import { type ListItemNode } from '../../document'
    import { editableMarkdown } from '../../markdown'
    import { ViewerModule } from '../../viewer-module'

    const viewer = getContext<ViewerModule>(ViewerModule)

    const style = createStyle('ListItem', viewer.designer)

    export let block: ListItemNode
</script>

<li
    class={style.root()}
    use:editableMarkdown={{ markdown: block.markdown, style }}
>
    <br />
</li>
