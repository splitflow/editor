export function getXPath(element: Node, root: Node) {
    const tokens = []
    while (element !== root) {
        const parent = element.parentNode
        tokens.unshift(getXPathToken(parent, element))
        element = parent
    }
    return tokens.join('/')
}

function getXPathToken(parent: Node, element: Node) {
    let position = 1
    for (const node of parent.childNodes) {
        if (node === element && node.nodeType === Node.TEXT_NODE) {
            return `text()[${position}]`
        }

        if (node === element) {
            return `${element.nodeName}[${position}]`
        }

        if (node.nodeName === element.nodeName) {
            position++
        }
    }
}
