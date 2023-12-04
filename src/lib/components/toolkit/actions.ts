export function rangeTooltip(element: HTMLElement) {
    function selectionchange() {
        const selection = window.getSelection()
        const range = selection.getRangeAt(0)

        if (!range?.collapsed ?? false) {
            const relativeElement = element.parentElement
            const relativeRect = relativeElement.getBoundingClientRect()
            const rangeRect = range.getBoundingClientRect()

            element.style.setProperty('visibility', 'visible')
            element.style.setProperty('position', 'absolute')
            element.style.setProperty(
                'left',
                `${
                    rangeRect.x -
                    relativeRect.x +
                    relativeElement.scrollLeft +
                    rangeRect.width / 2 -
                    element.offsetWidth / 2
                }px`
            )

            element.style.setProperty(
                'top',
                `${
                    rangeRect.y -
                    relativeRect.y +
                    relativeElement.scrollTop -
                    element.offsetHeight -
                    5
                }px`
            )
        } else {
            element.style.setProperty('visibility', 'hidden')
            element.style.removeProperty('position')
            element.style.removeProperty('left')
            element.style.removeProperty('top')
        }
    }

    selectionchange()
    document.addEventListener('selectionchange', selectionchange)
    return {
        destroy: () => document.removeEventListener('selectionchange', selectionchange)
    }
}
