<script>
    import { onMount } from 'svelte'
    import { Viewer } from '../../dist/index'

    export let module
    let element

    onMount(() => {
        const instance = new Viewer({
            props: { module },
            target: element.parentElement,
            anchor: element
        })
        return () => instance.$destroy()
    })
</script>

<div bind:this={element} />
