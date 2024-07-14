<svelte:options immutable={true} />

<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer'
    import { type ParagraphNode } from '../../document'
    import { editableMarkdown } from '../../markdown'
    import { ViewerModule } from '../../viewer-module'

    export let block: ParagraphNode

    const viewer = getContext<ViewerModule>(ViewerModule)

    const style = createStyle('Paragraph', viewer.designer)
</script>

<p class={style.root()} use:editableMarkdown={{ markdown: block.markdown, style }}>
    <br />
</p>
