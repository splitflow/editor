import { onMount } from 'svelte'

export function windowSelectionRange(listener: (selectionRange: Range) => void) {
    let startContainer: Node
    let endContainer: Node
    let collapsed: boolean

    onMount(() => {
        function selectionchange() {
            const selection = window.getSelection()
            const selectionRange = selection.getRangeAt(0)

            if (
                selectionRange.startContainer !== startContainer ||
                selectionRange.endContainer !== endContainer ||
                selectionRange.collapsed !== collapsed
            ) {
                startContainer = selectionRange.startContainer
                endContainer = selectionRange.endContainer
                collapsed = selectionRange.collapsed
                listener(selectionRange)
            }
        }

        document.addEventListener('selectionchange', selectionchange)

        return () => {
            document.removeEventListener('selectionchange', selectionchange)
        }
    })
}
