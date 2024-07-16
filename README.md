# SF Text Editor

 [SplitFlow Text Editor](https://splitflow.io/editor) is a fully featured web module including state management and data persistence. It is easily styled and configured with the SF no-code design tool and can be integrated in any web app with just a few lines of code.

- :heart: No-code for UI designers and developers.
- :sparkles: JS Framework agnostic with SSR support.
- :snowflake: Embedded into your app.
- :zap: Real time styling and configuration.

![SplitFlow Text Editor](https://github.com/splitflow/editor/blob/master/static/editor.png?raw=true)

## Start building

The Splitflow Design App allows to style and configure web modules with no coding skills. Start building your own [text editor](https://design.splitflow.io/_/editor).

## Integrate into your app

SF Text Editor is built with Svelte and can be embedded into any JS project. Below is a minimal React integration.

```bash
npm i @splitflow/editor @splitflow/react
```

```ts
import { useState } from 'react'
import { createEditor, embed } from '@splitflow/editor'
import { Editor } from '@splitflow/react'

export function MyComponent() {
    const [editor] = useState(() => {
        const editor = createEditor({
            accountId: '<your-account-id>',
            moduleId: '<your-module-id>'
        }).plugin(embed())
        editor.initialize()
        return editor
    })

    return <Editor module={editor} />
}
```

Check out the [react example](https://github.com/splitflow/react/tree/master/example) for an integration with NextJs with SSR support, or the 
[example page](https://github.com/splitflow/editor/tree/master/src/routes/+page.svelte) for an integration in a SvelteKit project.