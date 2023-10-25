import {
    isParagraphNode,
    isHeaderNode,
    type ParagraphNode,
    type HeaderNode,
    isListItemNode,
    type ListItemNode,
    type BlockNode
} from './document'
import { MarkdownParser, MarkdownTokenizer, TextEmitter } from './markdown'

const tokenizer = new MarkdownTokenizer()
const parser = new MarkdownParser()
const emitter = new TextEmitter()

export interface MergeDataAction {
    type: 'mergedata'
    block1: BlockNode
    block2: BlockNode
}

export interface MergeResult {
    block: BlockNode
}

export function mergeData(action: MergeDataAction): MergeResult {
    const { block1, block2 } = action

    /* paragraph */

    if (isParagraphNode(block1) && isParagraphNode(block2)) {
        const block: ParagraphNode = { ...block1, markdown: block1.markdown + block2.markdown }
        return { block }
    }

    if (isParagraphNode(block1) && isHeaderNode(block2)) {
        const block: ParagraphNode = { ...block1, markdown: block1.markdown + block2.text }
        return { block }
    }

    if (isParagraphNode(block1) && isListItemNode(block2)) {
        const block: ParagraphNode = { ...block1, markdown: block1.markdown + block2.markdown }
        return { block }
    }

    /* header */

    if (isHeaderNode(block1) && isHeaderNode(block2)) {
        const block: HeaderNode = { ...block1, text: block1.text + block2.text }
        return { block }
    }

    if (isHeaderNode(block1) && isParagraphNode(block2)) {
        const fragment = parser.parseMarkdown([...tokenizer.tokenizeMarkdown(block2.markdown)])
        const block: HeaderNode = { ...block1, text: block1.text + emitter.emitText(fragment) }
        return { block }
    }

    if (isHeaderNode(block1) && isListItemNode(block2)) {
        const fragment = parser.parseMarkdown([...tokenizer.tokenizeMarkdown(block2.markdown)])
        const block: HeaderNode = { ...block1, text: block1.text + emitter.emitText(fragment) }
        return { block }
    }

    /* list item */

    if (isListItemNode(block1) && isListItemNode(block2)) {
        const block: ListItemNode = { ...block1, markdown: block1.markdown + block2.markdown }
        return { block }
    }

    if (isListItemNode(block1) && isParagraphNode(block2)) {
        const block: ListItemNode = { ...block1, markdown: block1.markdown + block2.markdown }
        return { block }
    }

    if (isListItemNode(block1) && isHeaderNode(block2)) {
        const block: ListItemNode = { ...block1, markdown: block1.markdown + block2.text }
        return { block }
    }

    throw new Error('merge not supported')
}
