/**
 * We assume that the range endComponent is a textNode
 */
export function matchRangeBackward(range: Range, regex: RegExp) {
    let startContainer: Node
    let startOffset: number
    let endContainer: Node
    let endOffset: number

    // regex must stick to the end
    regex = regex.source.endsWith('$') ? regex : new RegExp(regex.source + '$')

    const iterator = document.createNodeIterator(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT
    )
    while (iterator.nextNode()) {} // move to end

    // move backward
    let text = ''
    let textNode: Text
    while ((textNode = iterator.previousNode() as Text)) {
        let textContent: string

        if (textNode === range.endContainer) {
            endContainer = range.endContainer
            endOffset = range.endOffset
            textContent = textNode.textContent.slice(0, range.endOffset)
        }

        if (endContainer) {
            textContent ??= textNode.textContent
            text = textContent + text

            const match = text.match(regex)
            if (match) {
                startContainer = textNode
                startOffset = text.length - match[0].length
                break
            }
        }

        if (textNode === range.startContainer) break
    }

    if (startContainer && endContainer) {
        const matchRange = document.createRange()
        matchRange.setStart(startContainer, startOffset)
        matchRange.setEnd(endContainer, endOffset)
        return matchRange
    }
}
