<svelte:options immutable={true} />

<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'

    const style = createStyle('Spacer')
</script>

<p class={style.root()}>
    <br />
</p>
