export function rangeTooltip(element: HTMLElement) {
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)

    function positionStyle(element: HTMLElement, range: Range) {
        if (element && range && !range.collapsed) {
            const relativeElement = element.parentElement
            const relativeRect = relativeElement.getBoundingClientRect()
            const rangeRect = range.getBoundingClientRect()

            element.style.left = `${
                rangeRect.x - relativeRect.x + rangeRect.width / 2 - element.offsetWidth / 2
            }px`

            element.style.top = `${rangeRect.y - relativeRect.y - element.offsetHeight}px;`
        }
    }

    positionStyle(element, range)
}
