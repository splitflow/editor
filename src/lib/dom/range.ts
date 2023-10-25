export function intersectRanges(range1: Range, range2: Range) {
    const startRange =
        range1.compareBoundaryPoints(Range.START_TO_START, range2) > 0 ? range1 : range2
    const endRange = range1.compareBoundaryPoints(Range.END_TO_END, range2) < 0 ? range1 : range2

    const result = document.createRange()
    result.setStart(startRange.startContainer, startRange.startOffset)
    result.setEnd(endRange.endContainer, endRange.endOffset)
    return result
}

export function unionRanges(range1: Range, range2: Range) {
    const startRange =
        range1.compareBoundaryPoints(Range.START_TO_START, range2) < 0 ? range1 : range2
    const endRange = range1.compareBoundaryPoints(Range.END_TO_END, range2) > 0 ? range1 : range2

    const result = document.createRange()
    result.setStart(startRange.startContainer, startRange.startOffset)
    result.setEnd(endRange.endContainer, endRange.endOffset)
    return result
}

export function substractFromRange(range: Range, tool: Range) {
    let beforeRange: Range
    let afterRange: Range

    if (range.compareBoundaryPoints(Range.START_TO_START, tool) < 0) {
        if (
            range.startContainer.firstChild === tool.startContainer &&
            range.startOffset === 0 &&
            tool.startOffset === 0
        ) {
            // before range is collapsed
            // skip
        } else {
            beforeRange = document.createRange()
            beforeRange.setStart(range.startContainer, range.startOffset)
            beforeRange.setEnd(tool.startContainer, tool.startOffset)
        }
    }

    if (range.compareBoundaryPoints(Range.END_TO_END, tool) > 0) {
        if (
            range.endContainer.lastChild === tool.endContainer &&
            range.endOffset === 1 &&
            tool.endOffset === tool.endContainer.textContent.length
        ) {
            // after range is collapsed
            // skip
        } else {
            afterRange = document.createRange()
            afterRange.setStart(tool.endContainer, tool.endOffset)
            afterRange.setEnd(range.endContainer, range.endOffset)
        }
    }

    return [beforeRange, afterRange]
}
