<script lang="ts">
	import { createStyle, createConfig } from '@splitflow/designer'
	import { setContext } from 'svelte'
	import { EditorModule, createEditor } from '../../editor-module'
	import Toolbar from './Toolbar.svelte'
	import Editable from './Editable.svelte'

	export let module: EditorModule = createEditor({})

	setContext(EditorModule, module)

	const style = createStyle('Editor', module.designer)
	const config = createConfig('Editor', module.designer)
</script>

<div class={`sf-css-reset ${style.root()}`} style="min-height: 0;">
	{#if $config.toolbar.enabled()}
		<Toolbar />
	{/if}
	<Editable />
</div>
