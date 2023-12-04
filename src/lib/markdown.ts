import {
    Parser,
    Tokenizer,
    consume,
    grab,
    lookup,
    type Node,
    type Element,
    type Text,
    Emitter
} from '@splitflow/core/compiler'
import type { Style } from '@splitflow/designer'

export class MarkdownTokenizer extends Tokenizer {
    tokenizeMarkdown(markdown: string) {
        return this.tokenize(markdown, this.createTokenizer([this.format, this.link, this.text]))
    }

    format(markdown: string, index: number): [string, number] {
        if (markdown[index] === '*' && markdown[index + 1] === '*') {
            return ['**', index + 2]
        }
        if (markdown[index] === '_') {
            return [markdown[index], index + 1]
        }
    }

    link(markdown: string, index: number): [string, number] {
        if (
            markdown[index] === '[' ||
            markdown[index] === ']' ||
            markdown[index] === '(' ||
            markdown[index] === ')'
        ) {
            return [markdown[index], index + 1]
        }
    }

    text(markdown: string, index: number): [string, number, boolean] {
        const position = consume(markdown, [index + 1], '*_[]()')
        return [markdown.slice(index, position), position, true]
    }
}

export class MarkdownParser extends Parser {
    constructor(style?: Style) {
        super()
        this.style = style
    }

    style: Style

    parseMarkdown(tokens: string[]) {
        return this.parse(
            tokens,
            [0, tokens.length],
            this.createParser([this.bold, this.italic, this.link, this.text])
        ) as DocumentFragment
    }

    bold(tokens: string[], range: [number, number]): [Node, number] {
        if (tokens[range[0]] === '**') {
            const position = lookup(tokens, [range[0] + 1, range[1]], '**')
            if (position) {
                const fragment = this.parse(
                    tokens,
                    [range[0] + 1, position],
                    this.createParser([this.italic, this.link, this.text])
                )

                const node = this.createElement('b')
                if (this.style) {
                    node.setAttribute('class', this.style.bold())
                }
                node.appendChild(fragment)

                return [node, position + 1]
            }
        }
    }

    italic(tokens: string[], range: [number, number]): [Node, number] {
        if (tokens[range[0]] === '_') {
            const position = lookup(tokens, [range[0] + 1, range[1]], '_')
            if (position) {
                const fragment = this.parse(
                    tokens,
                    [range[0] + 1, position],
                    this.createParser([this.bold, this.link, this.text])
                )

                const node = this.createElement('i')
                if (this.style) {
                    node.setAttribute('class', this.style.italic())
                }
                node.appendChild(fragment)

                return [node, position + 1]
            }
        }
    }

    link(tokens: string[], range: [number, number]): [Node, number] {
        if (tokens[range[0]] === '[') {
            const position1 = range[0]
            const position2 = lookup(tokens, [position1 + 1, range[1]], ']')
            const position3 = position2 && lookup(tokens, [position2 + 1, position2 + 2], '(')
            const position4 = position3 && lookup(tokens, [position3 + 1, range[1]], ')')

            if (position4) {
                const fragment = this.parse(
                    tokens,
                    [position1 + 1, position2],
                    this.createParser([this.bold, this.italic, this.text])
                )
                const href = grab(tokens, [position3 + 1, position4])

                const node = this.createElement('a')
                node.setAttribute('href', href)
                node.setAttribute('target', '_blank')
                if (this.style) {
                    node.setAttribute('class', this.style.link())
                }
                node.appendChild(fragment)

                return [node, position4 + 1]
            }
        }
    }

    text(tokens: string[], range: [number, number]): [Node, number] {
        const position = consume(tokens, [range[0] + 1, range[1]], ['**', '_', '[', ']', '(', ')'])

        const node = document.createTextNode(grab(tokens, [range[0], position]))
        return [node, position]
    }

    createDocumentFragment(): Node {
        return document.createDocumentFragment()
    }

    createElement(tagName: string): Element {
        return document.createElement(tagName)
    }

    createTextNode(data: string): Text {
        return document.createTextNode(data)
    }
}

export class MarkdownEmitter extends Emitter {
    #markdown: string

    emitMarkdown(node: Node) {
        this.#markdown = ''
        this.emit(node)
        return this.#markdown
    }

    element(node: Element): void {
        switch (node.tagName) {
            case 'B':
                this.#markdown += '**'
                this.emit(node)
                this.#markdown += '**'
                break
            case 'I':
                this.#markdown += '_'
                this.emit(node)
                this.#markdown += '_'
                break
            case 'A':
                this.#markdown += '['
                this.emit(node)
                this.#markdown += `](${node.getAttribute('href')})`
                break
            default:
                this.emit(node)
        }
    }

    text(node: Text): void {
        this.#markdown += node.textContent
    }
}

export class TextEmitter extends Emitter {
    #text: string

    emitText(node: Node) {
        this.#text = ''
        this.emit(node)
        return this.#text
    }

    element(node: Element): void {
        this.emit(node)
    }

    text(node: Text): void {
        this.#text += node.textContent
    }
}

export function editableMarkdown(
    element: HTMLElement,
    { markdown, style }: { markdown: string; style: Style }
) {
    const tokenizer = new MarkdownTokenizer()
    const parser = new MarkdownParser(style)

    function apply(markdown: string) {
        const fragment = parser.parseMarkdown([...tokenizer.tokenizeMarkdown(markdown)])

        if (fragment.hasChildNodes()) {
            element.replaceChildren(...fragment.childNodes)
        } else {
            element.replaceChildren(document.createElement('br'))
        }
    }

    apply(markdown)
    return {
        update: ({ markdown }: { markdown: string }) => apply(markdown)
    }
}
