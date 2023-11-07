import { findAncestor, getAncestors } from './node'
import { substractFromRange } from './range'

export function wrapRange(range: Range, root: Node, nodeName: string, className?: string) {
    if (findAncestor(range.commonAncestorContainer, root, nodeName)) {
        // range already wrapped. do nothing
        return
    }

    // wrap
    const wrapperElement = document.createElement(nodeName)
    if (className) {
        wrapperElement.setAttribute('class', className)
    }
    wrapperElement.append(range.collapsed ? '\u200C' : range.extractContents())
    range.insertNode(wrapperElement)

    // remove any nested wrapper
    const nestedWrapperElements = wrapperElement.querySelectorAll(nodeName)
    for (const nestedWrapperElement of nestedWrapperElements) {
        nestedWrapperElement.replaceWith(...nestedWrapperElement.childNodes)
    }

    // merge previous sibling wrapper
    if (wrapperElement.previousSibling?.nodeName === nodeName) {
        const previousWrapperElement = wrapperElement.previousSibling
        wrapperElement.prepend(...previousWrapperElement.childNodes)
        previousWrapperElement.remove()
    }

    // merge next sibling wrapper
    if (wrapperElement.nextSibling?.nodeName === nodeName) {
        const nextWrapperElement = wrapperElement.nextSibling
        wrapperElement.append(...nextWrapperElement.childNodes)
        nextWrapperElement.remove()
    }

    wrapperElement.normalize()
}

export function unwrapRange(range: Range, root: Node, nodeName: string) {
    const wrapperElement = findAncestor(range.commonAncestorContainer, root, nodeName) as Element

    if (wrapperElement) {
        // range fully wrapped. wrap before and after range individualy
        const className = wrapperElement.getAttribute('class')

        const wrapperRange = document.createRange()
        wrapperRange.selectNodeContents(wrapperElement)
        const [beforeRange, afterRange] = substractFromRange(wrapperRange, range)

        if (beforeRange) {
            const beforeWrapperElement = document.createElement(nodeName)
            beforeWrapperElement.setAttribute('class', className)
            beforeWrapperElement.append(beforeRange.extractContents())
            beforeRange.insertNode(beforeWrapperElement)
        }

        if (afterRange) {
            const afterWrapperElement = document.createElement(nodeName)
            afterWrapperElement.setAttribute('class', className)
            afterWrapperElement.append(afterRange.extractContents())
            afterRange.insertNode(afterWrapperElement)
        }

        if (range.collapsed) {
            range.insertNode(document.createTextNode('\u200C'))
        }

        const parentElement = wrapperElement.parentNode
        wrapperElement.replaceWith(...wrapperElement.childNodes)
        parentElement.normalize()
        return
    }

    // tool wrap
    const toolElement = document.createElement('div')
    toolElement.append(range.collapsed ? '\u200C' : range.extractContents())
    range.insertNode(toolElement)

    // remove any nested wrapper
    const nestedWrapperElements = toolElement.querySelectorAll(nodeName)
    for (const nestedWrapperElement of nestedWrapperElements) {
        nestedWrapperElement.replaceWith(...nestedWrapperElement.childNodes)
    }

    // remove previous empty sibling wrapper
    if (toolElement.previousSibling?.nodeName === nodeName) {
        const previousWrapperElement = toolElement.previousSibling
        previousWrapperElement.normalize()
        if (!previousWrapperElement.hasChildNodes()) {
            previousWrapperElement.remove()
        }
    }

    // remove next empty sibling wrapper
    if (toolElement.nextSibling?.nodeName === nodeName) {
        const nextWrapperElement = toolElement.nextSibling
        nextWrapperElement.normalize()
        if (!nextWrapperElement.hasChildNodes()) {
            nextWrapperElement.remove()
        }
    }

    const parentElement = toolElement.parentNode
    toolElement.replaceWith(...toolElement.childNodes)
    parentElement.normalize()
}

interface WrappersResult {
    [key: string]: boolean
}

export function getRangeWrappers(range: Range, root: Node) {
    // common wrappers
    const commonWrapperNodes = getAncestors(range.commonAncestorContainer, root, {
        includeNode: true
    })
    const commonWrappers = commonWrapperNodes.map((a) => a.nodeName)

    // text wrappers
    const content = range.cloneContents()
    const iterator = document.createNodeIterator(content, NodeFilter.SHOW_TEXT, (node) =>
        (node as Text).textContent.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    )

    let textWrappers: string[]
    let node: Node

    while ((node = iterator.nextNode())) {
        const textWrapperNodes = getAncestors(node, content)

        if (textWrappers) {
            // intersect text wrappers
            textWrappers = textWrappers.filter((w) =>
                textWrapperNodes.find((a) => a.nodeName === w)
            )
        } else {
            textWrappers = textWrapperNodes.map((a) => a.nodeName)
        }
    }

    return [...new Set([...commonWrappers, ...(textWrappers ?? [])])]
}
