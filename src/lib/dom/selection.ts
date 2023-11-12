import { findDescendant } from './node'
import { intersectRanges, substractFromRange } from './range'

export function isSelectionCollapsedAtStart(node: Node) {
    const selection = window.getSelection()
    const selectionRange = selection.getRangeAt(0)

    if (selectionRange?.collapsed && selectionRange?.intersectsNode(node)) {
        const nodeRange = document.createRange()
        nodeRange.selectNodeContents(node)

        const [beforeRange] = substractFromRange(nodeRange, selectionRange)
        if (!beforeRange || beforeRange.toString() === '') return true
    }
    return false
}

export function isSelectionCollapsedAtEnd(node: Node) {
    const selection = window.getSelection()
    const selectionRange = selection.getRangeAt(0)

    if (selectionRange?.collapsed && selectionRange?.intersectsNode(node)) {
        const nodeRange = document.createRange()
        nodeRange.selectNodeContents(node)

        const [, afterRange] = substractFromRange(nodeRange, selectionRange)
        if (!afterRange || afterRange.toString() === '') return true
    }
    return false
}

export function setSelectionCollapsed(node: Node, atStart = false) {
    const textNode = findDescendant(node, 'TEXT', !atStart)

    const selection = window.getSelection()
    const nodeRange = document.createRange()
    nodeRange.selectNodeContents(textNode ?? node)
    nodeRange.collapse(atStart)

    selection.removeAllRanges()
    selection.addRange(nodeRange)
}

export interface NodeOptions {
    beforeSelection?: boolean
    afterSelection?: boolean
}

export function cloneNode(node: Node, options?: NodeOptions) {
    if (options?.beforeSelection || options?.afterSelection) {
        const selection = window.getSelection()
        const selectionRange = selection.getRangeAt(0)

        if (selectionRange?.intersectsNode(node)) {
            const nodeRange = document.createRange()
            nodeRange.selectNodeContents(node)

            const [beforeRange, afterRange] = substractFromRange(nodeRange, selectionRange)
            if (options?.beforeSelection)
                return beforeRange?.cloneContents() ?? document.createDocumentFragment()
            if (options?.afterSelection)
                return afterRange?.cloneContents() ?? document.createDocumentFragment()
        }
    }
    return node
}

export function getNodeRange(node: Node, options?: NodeOptions) {
    const nodeRange = document.createRange()
    nodeRange.selectNodeContents(node)

    if (options?.beforeSelection || options?.afterSelection) {
        const selection = window.getSelection()
        const selectionRange = selection.getRangeAt(0)

        if (selectionRange?.intersectsNode(node)) {
            const [beforeRange, afterRange] = substractFromRange(nodeRange, selectionRange)
            if (options?.beforeSelection) return beforeRange
            if (options?.afterSelection) return afterRange
        }
    }
    return nodeRange
}

export function getBoundedSelectionRange(node: Node) {
    const selection = window.getSelection()
    const selectionRange = selection.getRangeAt(0)

    if (selectionRange?.intersectsNode(node)) {
        const nodeRange = document.createRange()
        nodeRange.selectNodeContents(node)
        return intersectRanges(selectionRange, nodeRange)
    }
}
