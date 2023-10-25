import { findAncestor } from './node'
import { substractFromRange } from './range'

export function wrapRange(range: Range, root: Node, nodeName: string, className?: string) {
    if (findAncestor(range.commonAncestorContainer, root, nodeName)) {
        // range already wrapped. do nothing
        return
    }
    const selection = window.getSelection()
    const selectionRange = selection.getRangeAt(0)
    const isSelectionStart = selectionRange.compareBoundaryPoints(Range.START_TO_START, range) === 0
    const isSelectionEnd = selectionRange.compareBoundaryPoints(Range.END_TO_END, range) === 0

    // wrap
    const wrapperElement = document.createElement(nodeName)
    if (className) {
        wrapperElement.setAttribute('class', className)
    }
    wrapperElement.appendChild(
        range.collapsed ? document.createTextNode('\u200C') : range.extractContents()
    )
    range.insertNode(wrapperElement)

    // remove any nested wrapper
    const nestedWrapperElements = wrapperElement.querySelectorAll(nodeName)
    for (const nestedWrapperElement of nestedWrapperElements) {
        nestedWrapperElement.replaceWith(...nestedWrapperElement.childNodes)
    }

    // restore selection
    if (isSelectionStart || isSelectionEnd) {
        if (isSelectionStart) {
            selectionRange.setStart(range.startContainer, range.startOffset)
        }
        if (isSelectionEnd) {
            selectionRange.setEnd(range.endContainer, range.endOffset)
        }
        selection.removeAllRanges()
        selection.addRange(selectionRange)
    }
}

export function unwrapRange(range: Range, root: Node, nodeName: string) {
    const selection = window.getSelection()
    const selectionRange = selection.getRangeAt(0)
    const isSelectionStart = selectionRange.compareBoundaryPoints(Range.START_TO_START, range) === 0
    const isSelectionEnd = selectionRange.compareBoundaryPoints(Range.END_TO_END, range) === 0
    const isRangeCollapsed = range.collapsed

    const wrapperElement = findAncestor(range.commonAncestorContainer, root, nodeName)
    if (wrapperElement) {
        // range fully wrapped. wrap before and after range individualy
        const wrapperRange = document.createRange()
        wrapperRange.selectNode(wrapperElement) // select node instead of content so wrapper element is included in the range
        const [beforeRange, afterRange] = substractFromRange(wrapperRange, range)

        if (beforeRange) {
            beforeRange.insertNode(beforeRange.extractContents())
        }

        if (afterRange) {
            afterRange.insertNode(afterRange.extractContents())
        }

        // update range to include wrapper element
        range.setStart(beforeRange.endContainer, beforeRange.endOffset)
        range.setEnd(afterRange.startContainer, afterRange.startOffset)
    }

    // unwrap
    if (isRangeCollapsed) {
        range.deleteContents()
        range.insertNode(document.createTextNode('\u200C'))
    } else {
        const content = range.extractContents()
        const nestedWrapperElements = content.querySelectorAll(nodeName)
        for (const nestedWrapperElement of nestedWrapperElements) {
            nestedWrapperElement.replaceWith(...nestedWrapperElement.childNodes)
        }
        range.insertNode(content)
    }

    // restore selection
    if (isSelectionStart || isSelectionEnd) {
        if (isSelectionStart) {
            selectionRange.setStart(range.startContainer, range.startOffset)
        }
        if (isSelectionEnd) {
            selectionRange.setEnd(range.endContainer, range.endOffset)
        }
        selection.removeAllRanges()
        selection.addRange(selectionRange)
    }
}

interface WrappersResult {
    [key: string]: boolean
}

export function getRangeWrappers<T extends WrappersResult>(
    range: Range,
    root: Node,
    wrappers: T
): T {
    // lookup wrappers on range container node
    const rangeWrappers = getNodeWrappers(range.commonAncestorContainer, root, wrappers)

    if (Object.keys(rangeWrappers).length === Object.keys(wrappers).length) {
        // range fully wrapped
        return rangeWrappers as T
    }

    const resultWrappers = Object.fromEntries(Object.entries(wrappers).map(([k]) => [k, false]))

    if (range.collapsed) {
        return { ...resultWrappers, ...rangeWrappers } as T
    }

    // lookup wrappers on each text node
    const content = range.cloneContents()
    const iterator = document.createNodeIterator(content, NodeFilter.SHOW_TEXT, (node) =>
        (node as Text).textContent.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    )

    let textWrappers = Object.fromEntries(Object.entries(wrappers).map(([k]) => [k, true]))
    let node: Node

    let empty = true
    while ((node = iterator.nextNode())) {
        empty = false
        textWrappers = {
            ...textWrappers,
            ...getMissingNodeWrappers(node, content, wrappers)
        }
    }

    if (empty) {
        return { ...resultWrappers, ...rangeWrappers } as T
    }

    return { ...textWrappers, ...rangeWrappers } as T
}

function getNodeWrappers(node: Node, root: Node, wrappers: WrappersResult): WrappersResult {
    const result = {}

    while (node !== root) {
        const nodeName = node.nodeName
        if (wrappers[nodeName] !== undefined) {
            result[nodeName] = true
        }
        node = node.parentNode
    }
    return result
}

function getMissingNodeWrappers(node: Node, root: Node, wrappers: WrappersResult): WrappersResult {
    const result = Object.fromEntries(Object.entries(wrappers).map(([k]) => [k, false]))

    while (node !== root) {
        const nodeName = node.nodeName
        if (result[nodeName] !== undefined) {
            delete result[nodeName]
        }
        node = node.parentNode
    }
    return result
}
