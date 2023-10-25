import { describe, expect, it } from 'vitest'
import { MarkdownParser, MarkdownTokenizer } from '../../lib/markdown'

describe('MarkdownParser', () => {
    it('.parseMarkdown() paragraph with bold', () => {
        const tokenizer = new MarkdownTokenizer()
        const parser = new MarkdownParser()
        const tokens = tokenizer.tokenizeMarkdown('markdown with **bold** text')
        const node = parser.parseMarkdown([...tokens])

        expect([...node.childNodes]).to.have.length(1)
        expect([...node.childNodes][0].nodeName).to.equal('P')
        const pNode = [...node.childNodes][0]
        expect([...pNode.childNodes]).to.have.length(3)
        expect([...pNode.childNodes][1].nodeName).to.equal('B')
    })
    it('.parseMarkdown() list', () => {
        const tokenizer = new MarkdownTokenizer()
        const parser = new MarkdownParser()
        const tokens = tokenizer.tokenizeMarkdown('1. first item  \n1. second item')
        const node = parser.parseMarkdown([...tokens])

        expect([...node.childNodes]).to.have.length(1)
        expect([...node.childNodes][0].nodeName).to.equal('OL')
        const olNode = [...node.childNodes][0]
        expect([...olNode.childNodes]).to.have.length(2)
        expect([...olNode.childNodes][1].nodeName).to.equal('IL') 
    })
})
