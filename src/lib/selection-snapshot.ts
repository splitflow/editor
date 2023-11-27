export interface SelectionSnapshot {
    root: Node
    collapsed: boolean
    startBlockId: string
    startOffset: number
    endBlockId: string
    endOffset: number
}

export function collapseSelectionSnapshot(snapshot: SelectionSnapshot, atStart = false) {
    if (!snapshot) return snapshot

    if (atStart) {
        return {
            ...snapshot,
            collapsed: true,
            endBlockId: snapshot.startBlockId,
            endOffset: snapshot.startOffset
        }
    }

    return {
        ...snapshot,
        collapsed: true,
        startBlockId: snapshot.endBlockId,
        startOffset: snapshot.endOffset
    }
}

export function createSelectionSnapshot(root: HTMLElement): SelectionSnapshot {
    function walk(root: Node, container: Node, offset: number) {
        if (!root) return

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        )

        let count = 0
        while (true) {
            if (walker.currentNode === container) return count + offset

            if (walker.currentNode.nodeType === Node.TEXT_NODE) {
                const textNode = walker.currentNode as Text
                count += textNode.length
            }

            if (!walker.nextNode()) break
        }
    }

    const selection = window.getSelection()
    const range = selection.getRangeAt(0)

    if (range) {
        const collapsed = range.collapsed
        const [startBlockNode, startBlockId] = findBlock(range.startContainer, root)
        const startOffset = walk(startBlockNode, range.startContainer, range.startOffset)
        const [endBlockNode, endBlockId] = collapsed
            ? [startBlockNode, startBlockId]
            : findBlock(range.endContainer, root)
        const endOffset = collapsed
            ? startOffset
            : walk(endBlockNode, range.endContainer, range.endOffset)

        if (startBlockId && endBlockId) {
            return {
                root,
                collapsed,
                startBlockId,
                startOffset,
                endBlockId,
                endOffset
            }
        } else {
            console.warn('Unable to snapshot selection')
        }
    }
}

export function restoreSelectionSnapshot(snapshot: SelectionSnapshot) {
    function walk(root: Node, offset: number, eager = false): [Node, number] {
        if (!root) return [undefined, undefined]

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        )
        while (true) {
            if (walker.currentNode.nodeType === Node.ELEMENT_NODE) {
                const element = walker.currentNode

                if (!eager && offset === 0) return [element, 0]
                if (eager && offset === 0 && !element.hasChildNodes()) return [element, 0]
            }

            if (walker.currentNode.nodeType === Node.TEXT_NODE) {
                const textNode = walker.currentNode as Text

                if (!eager && offset === 0) return [textNode, textNode.length] // retry case
                if (!eager && textNode.length >= offset) return [textNode, offset]
                if (
                    eager &&
                    offset === 0 &&
                    textNode.length === 1 &&
                    textNode.textContent === '\u200C'
                )
                    return [textNode, 1] // select after applying formatting to collapsed selection
                if (eager && textNode.length > offset) return [textNode, offset]
                offset -= textNode.length
            }

            if (!walker.nextNode()) {
                if (eager && offset === 0) {
                    // text node is last. retry with eager = false
                    eager = false
                    continue
                }
                break
            }
        }

        return [undefined, undefined]
    }

    if (snapshot) {
        const collapsed = snapshot.collapsed
        const startBlockNode = selectBlock(snapshot.startBlockId, snapshot.root)
        const [startContainer, startOffset] = walk(startBlockNode, snapshot.startOffset, true)
        const endBlockNode = collapsed
            ? startBlockNode
            : selectBlock(snapshot.endBlockId, snapshot.root)
        const [endContainer, endOffset] = collapsed
            ? [startContainer, startOffset]
            : walk(endBlockNode, snapshot.endOffset)

        if (startContainer && endContainer) {
            const range = document.createRange()
            range.setStart(startContainer, startOffset)
            range.setEnd(endContainer, endOffset)

            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(range)
        } else {
            console.warn('Unable to restore selection')
        }
    }
}

function findBlock(node: Node, root: Node): [Node, string] {
    while (node !== root) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const blockId = (node as Element).getAttribute('data-sf-block-id')
            if (blockId) return [node, blockId]
        }
        node = node.parentNode
    }
    return [undefined, undefined]
}

function selectBlock(id: string, root: Node) {
    const element = root as Element
    return element.querySelector(`[data-sf-block-id='${id}']`)
}
