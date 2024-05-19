import type { Result } from '@splitflow/app'
import { type BlockNode, createSpacerBlock } from './document'
import { MarkdownParser, MarkdownTokenizer, TextEmitter } from './markdown'

const tokenizer = new MarkdownTokenizer()
const parser = new MarkdownParser()
const emitter = new TextEmitter()

interface MarkdownNode {
    blockType: string
    blockId: string
    position: number
    markdown: string
}

interface TextNode {
    blockType: string
    blockId: string
    position: number
    text: string
}

function isMarkdownNode(block: BlockNode): block is MarkdownNode {
    return (block as any)?.markdown !== undefined ?? false
}

function isTextNode(block: BlockNode): block is TextNode {
    return (block as any)?.text !== undefined ?? false
}

export interface MergeDataAction {
    type: 'mergedata'
    block1: BlockNode
    block2: BlockNode
    fallback?: boolean
}

export interface MergeResult extends Result {
    block: BlockNode
}

export function mergeData(action: MergeDataAction): MergeResult {
    const { block1, block2 } = action

    if (isMarkdownNode(block1) && isMarkdownNode(block2)) {
        const block: MarkdownNode = { ...block1, markdown: block1.markdown + block2.markdown }
        return { block }
    }

    if (isMarkdownNode(block1) && isTextNode(block2)) {
        const block: MarkdownNode = { ...block1, markdown: block1.markdown + block2.text }
        return { block }
    }

    if (isTextNode(block1) && isTextNode(block2)) {
        const block: TextNode = { ...block1, text: block1.text + block2.text }
        return { block }
    }

    if (isTextNode(block1) && isMarkdownNode(block2)) {
        const fragment = parser.parseMarkdown([...tokenizer.tokenizeMarkdown(block2.markdown)])
        const block: TextNode = { ...block1, text: block1.text + emitter.emitText(fragment) }
        return { block }
    }

    if (action.fallback ?? false) {
        // if bocks data can't be merged, fallback to the textual node or a spacer
        // used when a void node is involved

        if (isMarkdownNode(block1) || isTextNode(block1)) {
            return { block: block1 }
        }

        if (isMarkdownNode(block2) || isTextNode(block2)) {
            return { block: block2 }
        }

        const block = createSpacerBlock(block1.position)
        return { block }
    }

    return { block: undefined }
}
