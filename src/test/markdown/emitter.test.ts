import { CDocumentFragment, CElement, CText } from '@splitflow/core/compiler'
import { describe, expect, it } from 'vitest'
import { MarkdownEmitter, TextEmitter } from '../../lib/markdown'

// Emitter has browser dependencies.
describe('MarkdownEmitter', () => {
    it('.emitMarkdown() default', () => {
        /*
        const node = new CElement('P')
        const tNode = new CText('some text')
        node.appendChild(tNode)

        const emitter = new MarkdownEmitter()
        expect(emitter.emitMarkdown(node)).to.equal('some text')
        */
    })
})

describe('TextEmitter', () => {
    it('.emitText() list', () => {
        /*
        const node = new CDocumentFragment()
        const olNode = new CElement('OL')

        const li1Node = new CElement('LI')
        li1Node.appendChild(new CText('first item'))
        const li2Node = new CElement('LI')
        li2Node.appendChild(new CText('second item'))

        olNode.appendChild(li1Node)
        olNode.appendChild(li2Node)
        node.appendChild(olNode)

        const emitter = new TextEmitter()
        expect(emitter.emitText(node)).to.equal('first itemsecond item')
        */
    })
})
