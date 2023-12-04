<script lang="ts">
    import { createStyle } from '@splitflow/designer/svelte'
    import { type ImageNode } from '../../document'

    export let block: ImageNode

    const style = createStyle('Image')
</script>

<figure class={style.root()}>
    <img class={style.image()} draggable="false" alt="" src={block.src} />
</figure>