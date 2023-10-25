import { getXPath } from './xpath'

export interface RangeSnapshot {
    root: Node
    startXPath: string
    startOffset: number
    endXPath: string
    endOffset: number
    collapsed: boolean
}

export interface CreateSelectionSnapshotOptions {
    collapsedAtStart: boolean
    collapsedAtEnd: boolean
}

export function createSelectionSnapshot(
    root: Node,
    options?: CreateSelectionSnapshotOptions
): RangeSnapshot {
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)

    if (
        range &&
        (range.collapsed || options?.collapsedAtStart) &&
        root.contains(range.startContainer)
    ) {
        const startXPath = getXPath(range.startContainer, root)
        return {
            root,
            startXPath,
            startOffset: range.startOffset,
            endXPath: startXPath,
            endOffset: range.startOffset,
            collapsed: true
        }
    }

    if (range && options?.collapsedAtEnd && root.contains(range.endContainer)) {
        const endXPath = getXPath(range.endContainer, root)
        return {
            root,
            startXPath: endXPath,
            startOffset: range.endOffset,
            endXPath,
            endOffset: range.endOffset,
            collapsed: true
        }
    }

    if (range && root.contains(range.commonAncestorContainer)) {
        const startXPath = getXPath(range.startContainer, root)
        const endXPath = getXPath(range.endContainer, root)
        return {
            root,
            startXPath,
            startOffset: range.startOffset,
            endXPath,
            endOffset: range.endOffset,
            collapsed: false
        }
    }
}

export function restoreSelectionSnapshot(snapshot: RangeSnapshot) {
    if (snapshot) {
        const startContainer = document.evaluate(
            snapshot.startXPath,
            snapshot.root,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE
        ).singleNodeValue

        const endContainer = snapshot.collapsed
            ? startContainer
            : document.evaluate(
                  snapshot.endXPath,
                  snapshot.root,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE
              ).singleNodeValue

        if (startContainer && endContainer) {
            const range = document.createRange()
            range.setStart(startContainer, snapshot.startOffset)
            range.setEnd(endContainer, snapshot.endOffset)

            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(range)
        } else {
            console.warn('Unable to restore selection')
        }
    }
}
