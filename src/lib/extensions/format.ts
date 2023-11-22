import type { Result } from '@splitflow/app'
import type { Style } from '@splitflow/designer'
import { onMount } from 'svelte'
import type { EditorModule, FormatAction } from '../editor-module'
import {
    debounceSelectionChange,
    getBoundedSelectionRange,
    getRangeWrappers,
    unwrapRange,
    wrapRange
} from '../dom'
import { key, type BlockNode } from '../document'
import { formatData } from '../stores/document/format'

export function activateFormat(editor: EditorModule, style: Style) {
    const { format: formatStore } = editor.stores

    let element: HTMLElement
    let block: BlockNode

    onMount(() => {
        document.addEventListener('selectionchange', selectionChange)
        editor.dispatcher.addActionHandler('format', format, editor)
        return () => {
            document.removeEventListener('selectionchange', selectionChange)
            editor.dispatcher.removeActionHandler('format', format, editor)
        }
    })

    function format(action: FormatAction): Result {
        const range = getBoundedSelectionRange(element)
        if (range) {
            if (action.off) {
                unwrapRange(range, element, action.tagName)
            } else {
                wrapRange(range, element, action.tagName, style[action.className]())
            }
            return {}
        }
    }

    const selectionChange = debounceSelectionChange(() => {
        const range = getBoundedSelectionRange(element)
        if (range) {
            formatStore.push({
                [key(block)]: formatData(getRangeWrappers(range, element))
            })
            return
        }
        formatStore.clear(key(block))
    })

    return {
        set element(_element: HTMLElement) {
            element = _element
        },
        set block(_block: BlockNode) {
            block = _block
        }
    }
}
