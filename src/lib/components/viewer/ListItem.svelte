<svelte:options immutable={true} />

<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import { type ListItemNode } from '../../document'
    import { editableMarkdown } from '../../markdown'

    const style = createStyle('ListItem')

    export let block: ListItemNode
</script>

<li
    class={style.root()}
    use:editableMarkdown={{ markdown: block.markdown, style }}
>
    <br />
</li>
