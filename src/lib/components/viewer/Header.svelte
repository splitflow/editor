<svelte:options immutable={true} />

<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer'
    import { type HeaderNode } from '../../document'
    import { editableText } from '../../text'
	import { ViewerModule } from '../../viewer-module'

    export let block: HeaderNode

    const viewer = getContext<ViewerModule>(ViewerModule)

    const style = createStyle('Header', viewer.designer)
</script>

<h1 class={style.root()} use:editableText={block.text}>
    <br />
</h1>
