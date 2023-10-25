<svelte:options immutable={true} />

<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import { type ParagraphNode } from '../../document'
    import { editableMarkdown } from '../../markdown'

    export let block: ParagraphNode

    const style = createStyle('Paragraph')
</script>

<p class={style.root()} use:editableMarkdown={{ markdown: block.markdown, style }}>
    <br />
</p>
