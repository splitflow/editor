<svelte:options immutable={true} />

<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import { type HeaderNode } from '../../document'
    import { editableText } from '../../text'

    export let block: HeaderNode

    const style = createStyle('Header')
</script>

<h1 class={style.root()} use:editableText={block.text}>
    <br />
</h1>
