export interface AncestorOptions {
    includeNode?: boolean
    includeRoot?: boolean
}

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

export function getAncestors(node: Node, root: Node, options?: AncestorOptions) {
    const result: Node[] = []
    while (node !== root) {
        result.unshift(node)
        node = node.parentNode
    }

    if (!options?.includeNode) result.pop()
    if (options?.includeRoot) result.unshift(root)
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
