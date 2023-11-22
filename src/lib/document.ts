export interface DocumentNode {
    [key: string]: BlockDataNode
}

export interface BlockDataNode {
    [key: string]: unknown
}

export interface BlockNode {
    blockId: string
    blockType: string
    position: number
}

export interface SpacerNode {
    blockType: 'spacer'
    blockId: string
    position: number
    text: string
}

export interface PromptNode {
    blockType: 'prompt'
    blockId: string
    position: number
    placeholder: string
    run: (value: string) => void
}

export interface ParagraphNode {
    blockType: 'paragraph'
    blockId: string
    position: number
    markdown: string
}

export interface ListItemNode {
    blockType: 'list-item'
    blockId: string
    position: number
    ordered: boolean
    markdown: string
}

export interface HeaderNode {
    blockType: 'header'
    blockId: string
    position: number
    text: string
}

export interface ImageNode {
    blockType: 'image'
    blockId: string
    position: number
    src: string
}

export function createBlock<T extends BlockNode>(
    block: T,
    position = 10e8,
    blockId: string = crypto.randomUUID()
): T {
    return {
        ...block,
        blockId,
        position
    }
}

export function createSpacerBlock(position = 10e8): SpacerNode {
    return {
        blockType: 'spacer',
        blockId: crypto.randomUUID(),
        position,
        text: ''
    }
}

export function createPromptBlock(
    placeholder = '',
    run: (value: string) => void,
    position = 10e8
): PromptNode {
    return {
        blockType: 'prompt',
        blockId: crypto.randomUUID(),
        position,
        placeholder,
        run
    }
}

export function createParagraphBlock(markdown = '', position = 10e8): ParagraphNode {
    return {
        blockType: 'paragraph',
        blockId: crypto.randomUUID(),
        position,
        markdown
    }
}

export function createListItemBlock(markdown = '', ordered = false): ListItemNode {
    return {
        blockType: 'list-item',
        blockId: crypto.randomUUID(),
        position: 10e8,
        ordered,
        markdown
    }
}

export function createHeaderBlock(text = ''): HeaderNode {
    return {
        blockType: 'header',
        blockId: crypto.randomUUID(),
        position: 10e8,
        text
    }
}

export function createImageBlock(src: string): ImageNode {
    return {
        blockType: 'image',
        blockId: crypto.randomUUID(),
        position: 10e8,
        src
    }
}

export function isBlockNode(block: any): block is BlockNode {
    return !!block?.blockType && !!block?.blockId
}

export function isSpacerNode(block: BlockNode): block is SpacerNode {
    return block?.blockType === 'spacer'
}

export function isPromptNode(block: BlockNode): block is PromptNode {
    return block?.blockType === 'prompt'
}

export function isParagraphNode(block: BlockNode): block is ParagraphNode {
    return block?.blockType === 'paragraph'
}

export function isListItemNode(block: BlockNode): block is ListItemNode {
    return block?.blockType === 'list-item'
}

export function isHeaderNode(block: BlockNode): block is HeaderNode {
    return block?.blockType === 'header'
}

export function isImageNode(block: BlockNode): block is ImageNode {
    return block?.blockType === 'image'
}

export function key(block: BlockNode) {
    return `${block.blockType}:${block.blockId}`
}

export function parseKey(key: string): BlockNode {
    const [blockType, blockId] = key.split(':')
    return { blockType, blockId, position: 0 }
}

export function data(block: BlockNode, dropPosition = false): BlockDataNode {
    if (dropPosition) {
        const { blockType, blockId, position, ...data } = block
        return data
    }
    const { blockType, blockId, ...data } = block
    return data
}

export function isEqual(block1: BlockNode, block2: BlockNode) {
    return block1.blockType === block2.blockType && block1.blockId === block2.blockId
}

export function insertPosition(position1?: number, position2?: number) {
    if (position1 && position2) {
        return Math.round((position1 + position2) / 2)
    }
    if (position1) {
        return Math.round(position1 + 10e8)
    }
    if (position2) {
        return Math.round(position2 / 2)
    }
    return 10e8
}
