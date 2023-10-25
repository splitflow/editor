<script>
    import { onMount } from 'svelte'
    import { Editor } from '../../dist/index'

    export let module
    let element

    onMount(() => {
        const instance = new Editor({
            props: { module },
            target: element.parentElement,
            anchor: element
        })
        return () => instance.$destroy()
    })
</script>

<div bind:this={element} />
