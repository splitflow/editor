export function findAncestor(element: Node, root: Node, nodeName: string) {
    while (element !== root) {
        if (element.nodeName === nodeName) return element
        element = element.parentElement
    }
}

export function findAncestorRootChild(element: HTMLElement, root: HTMLElement) {
    while (element !== root) {
        if (element.parentElement === root) return element
        element = element.parentElement
    }
}

export function getAncestors(node: Node, root: Node) {
    const result = [node]
    while (result[0] !== root) {
        result.unshift(result[0].parentNode)
    }
    return result
}

export function findDescendant(node: Node, tagName: string, last = false) {
    const iterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT)

    let result: Node
    while ((node = iterator.nextNode())) {
        result = node
        if (!last) break
    }
    return result
}
