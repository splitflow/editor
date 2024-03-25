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
        localStorage.setItem(`sf/accounts/_/pods/${editorId}/style.json`, JSON.stringify(style))
        localStorage.setItem(`sf/accounts/_/pods/${editorId}/config.json`, JSON.stringify(config))
        localStorage.setItem(
            `sf/accounts/_/editors/_/documents/${editorId}/doc.json`,
            JSON.stringify(document)
        )
    }

    initializeSplitflowApp({ devtool: true, local: true })
    const editor = createEditor({ moduleId: editorId }).plugin(embed())

    const promise = (async () => {
        const { error: error1 } = await editor.initialize()
        if (error1) return { error: error1 }

        const { error: error2 } = await editor.updateDocument({ documentId: editorId })
        if (error2) return { error: error2 }
        
        return {}
    })()
</script>

{#await promise then { error }}
    {#if error}
        {error.message}
    {:else}
        <main>
            <div>
                <Editor module={editor} />
            </div>
            <div class="right">
                <Viewer module={editor} />
            </div>
        </main>
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
