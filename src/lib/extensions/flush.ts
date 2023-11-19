import { onMount } from 'svelte'
import { isEqual, type BlockNode } from '../document'
import { cloneNode } from '../dom'
import type { EditorModule, FlushAction, FlushResult } from '../editor-module'
import { MarkdownEmitter } from '../markdown'

export function activateFlushMarkdown(editor: EditorModule) {
    const emitter = new MarkdownEmitter()

    let _element: HTMLElement
    let _block: BlockNode & { markdown: string }

    onMount(() => {
        editor.dispatcher.addActionHandler('flush', flush, editor)
        return () => editor.dispatcher.removeActionHandler('flush', flush, editor)
    })

    function flush(action: FlushAction): FlushResult {
        if (isEqual(action.block, _block)) {
            const fragment = cloneNode(_element, action)
            const markdown = emitter.emitMarkdown(fragment)
            if (action.change && markdown === _block.markdown) {
                return { block: null }
            }
            const block = { ..._block, markdown }
            return { block }
        }
    }

    return {
        set element(element: HTMLElement) {
            _element = element
        },
        set block(block: BlockNode & { markdown: string }) {
            _block = block
        }
    }
}

export function activateFlushText(editor: EditorModule) {
    let _element: HTMLElement
    let _block: BlockNode & { text: string }

    onMount(() => {
        editor.dispatcher.addActionHandler('flush', flush, editor)
        return () => editor.dispatcher.removeActionHandler('flush', flush, editor)
    })

    function flush(action: FlushAction): FlushResult {
        if (isEqual(action.block, _block)) {
            const fragment = cloneNode(_element, action)
            const text = fragment.textContent
            if (action.change && text === _block.text) {
                return { block: null }
            }
            const block = { ..._block, text }
            return { block }
        }
    }

    return {
        set element(element: HTMLElement) {
            _element = element
        },
        set block(block: BlockNode & { text: string }) {
            _block = block
        }
    }
}
