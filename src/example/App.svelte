<script lang="ts">
    import '@splitflow/css-reset'
    import { initializeSplitflowApp } from '@splitflow/app'
    import Editor from '../lib/components/editor/Editor.svelte'
    import Viewer from '../lib/components/viewer/Viewer.svelte'
    import { createEditor } from '../lib/editor-module'
    import style from './assets/style.json'
    import config from './assets/config.json'
    import document from './assets/document.json'
    import { embed } from '../lib/plugins'

    let editorId = localStorage.getItem('editor-id')
    if (!editorId) {
        editorId = crypto.randomUUID()
        localStorage.setItem('editor-id', editorId)
        localStorage.setItem(`sf/design/style/${editorId}.node.json`, JSON.stringify(style))
        localStorage.setItem(`sf/design/config/${editorId}.node.json`, JSON.stringify(config))
        localStorage.setItem(`sf/editor/document/${editorId}.node.json`, JSON.stringify(document))
    }

    initializeSplitflowApp({ devtool: true, local: true })
    const promise = createEditor({ moduleId: editorId, documentId: editorId })
        .plugin(embed())
        .initialize()
</script>

{#await promise then { editor, error }}
    {#if editor}
        <main>
            <div>
                <Editor module={editor} />
            </div>
            <div class="right">
                <Viewer module={editor} />
            </div>
        </main>
    {:else}
        {error.message}
    {/if}
{/await}

<style>
    :global(body) {
        margin: 0;
        background-color: lightgray;
    }

    main {
        all: unset;
        display: flex;
        gap: 2rem;
        padding-top: 4rem;
        padding-bottom: 4rem;
        padding-left: 4rem;
        padding-right: 4rem;
        box-sizing: border-box;
        height: 100vh;
        font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
        font-size: 16px;
        font-weight: 400;
    }

    div {
        all: unset;
        display: flex;
        flex: 1;
        flex-direction: column;
        overflow: hidden;
        border-radius: 0.5rem;
    }

    .right {
        overflow-x: hidden;
        overflow-y: auto;
    }
</style>
