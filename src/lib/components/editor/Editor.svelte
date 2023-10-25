<script lang="ts">
    import { SplitflowDesigner, createStyle, createConfig } from '@splitflow/designer'
    import { setContext } from 'svelte'
    import { EditorModule, createEditor } from '../../editor-module'
    import Toolbar from './Toolbar.svelte'
    import Editable from './Editable.svelte'
    import FloatingToolbar from './FloatingToolbar.svelte'

    export let module: EditorModule = createEditor()

    setContext(EditorModule, module)
    setContext(SplitflowDesigner, module.designer)

    const style = createStyle('Editor', module.designer)
    const config = createConfig('Editor', module.designer)
</script>

<div class={`sf-css-reset ${style.root()}`}>
    {#if $config.toolbar.enabled()}
        <Toolbar />
    {/if}
    <Editable />
    {#if $config.floatingToolbar.enabled()}
        <FloatingToolbar />
    {/if}
</div>

<style>
    div {
        position: relative;
        min-height: 0;
    }
</style>
