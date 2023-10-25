export function editableText(element: HTMLElement, text: string) {
    function apply(text: string) {
        if (text.length > 0) {
            element.replaceChildren(text)
        } else {
            element.replaceChildren(document.createElement('br'))
        }
    }

    apply(text)
    return {
        update: (text: string) => apply(text)
    }
}
