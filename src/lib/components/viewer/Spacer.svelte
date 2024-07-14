<svelte:options immutable={true} />

<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer'
    import { ViewerModule } from '../../viewer-module'

    const viewer = getContext<ViewerModule>(ViewerModule)

    const style = createStyle('Spacer', viewer.designer)
</script>

<p class={style.root()}>
    <br />
</p>
