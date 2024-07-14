<script lang="ts">
    import { getContext } from 'svelte'
    import { createStyle } from '@splitflow/designer'
    import { type ImageNode } from '../../document'
    import { ViewerModule } from '../../viewer-module'

    export let block: ImageNode

    const viewer = getContext<ViewerModule>(ViewerModule)

    const style = createStyle('Image', viewer.designer)
</script>

<figure class={style.root()}>
    <img class={style.image()} draggable="false" alt="" src={block.src} />
</figure>