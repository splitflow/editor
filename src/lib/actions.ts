import type { Result } from '@splitflow/app'
import { first, last } from '@splitflow/core/utils'
import {
    key,
    createParagraphBlock,
    data,
    createBlock,
    type BlockNode,
    type BlockDataNode,
    createPromptBlock,
    createSpacerBlock
} from './document'
import { EditorModule } from './editor-module'

export interface MergeAction {
    type: 'merge'
    block1: BlockNode
    block2: BlockNode
}

export function merge(action: MergeAction, editor: EditorModule): Result {
    const block1 = editor.flush(action.block1)
    const block2 = editor.flush(action.block2)
    const mergedBlock = editor.mergeData(block1, block2)

    editor.stores.fragments.push({
        [key(mergedBlock)]: data(mergedBlock, true),
        [key(block2)]: null
    })
    editor.select(block1, { restoreAfterUpdate: true })

    return {}
}

export interface BreaklineAction {
    type: 'breakline'
    block: BlockNode
}

export function breakline(action: BreaklineAction, editor: EditorModule): Result {
    const block = editor.flush(action.block, { beforeSelection: true })
    const shadowBlock = editor.flush(action.block, { afterSelection: true })
    const paragraphPosition = editor.stores.document.insertAfterPosition(block)

    let paragraphBlock = createParagraphBlock('', paragraphPosition)
    paragraphBlock = editor.mergeData(paragraphBlock, shadowBlock)

    editor.stores.fragments.push({
        [key(block)]: data(block, true),
        [key(paragraphBlock)]: data(paragraphBlock)
    })
    editor.select(paragraphBlock, { atStart: true, afterUpdate: true })
    return {}
}

export interface SplitAction {
    type: 'split'
    block: BlockNode
}

export function split(action: SplitAction, editor: EditorModule): Result {
    const block = editor.flush(action.block, { beforeSelection: true })
    const shadowBlock = editor.flush(action.block, { afterSelection: true })

    const splitBlockPosition = editor.stores.document.insertAfterPosition(block)
    const splitBlock = createBlock(shadowBlock, splitBlockPosition)

    editor.stores.fragments.push({
        [key(block)]: data(block, true),
        [key(splitBlock)]: data(splitBlock)
    })
    editor.select(splitBlock, { atStart: true, afterUpdate: true })
    return {}
}

export interface CollapseAction {
    type: 'collapse'
    selection: BlockNode[]
}

export function collapse(action: CollapseAction, editor: EditorModule): Result {
    const firstBlock = editor.flush(first(action.selection), { beforeSelection: true })
    const lastBlock = editor.flush(last(action.selection), { afterSelection: true })
    const deleteBlocks = action.selection.slice(1, -1)
    const mergedBlock = editor.mergeData(firstBlock, lastBlock)

    editor.stores.fragments.push({
        [key(mergedBlock)]: data(mergedBlock),
        [key(lastBlock)]: null,
        ...Object.fromEntries(deleteBlocks.map((block) => [[key(block)], null]))
    })
    editor.snapshotSelection({
        block: mergedBlock,
        collapsedAtStart: true,
        restoreAfterUpdate: true
    })

    return {}
}

export interface SwapAction {
    type: 'swap'
    selection: BlockNode[]
    templateBlock: BlockNode
}

export function swap(action: SwapAction, editor: EditorModule): Result {
    const swapedBlocks = new Array<BlockNode>()
    const deleteBlocks = new Array<BlockNode>()

    for (const block of action.selection) {
        const flushedBlock = editor.flush(block)

        if (block.blockType !== action.templateBlock.blockType) {
            let swapedBlock = createBlock(
                action.templateBlock,
                flushedBlock.position,
                flushedBlock.blockId
            )
            swapedBlock = editor.mergeData(swapedBlock, flushedBlock)
            swapedBlocks.push(swapedBlock)
            deleteBlocks.push(flushedBlock)
        }
    }

    editor.stores.fragments.push({
        ...Object.fromEntries(deleteBlocks.map((block) => [[key(block)], null])),
        ...Object.fromEntries(swapedBlocks.map((block) => [[key(block)], data(block)]))
    })
    editor.snapshotSelection({ restoreAfterUpdate: true })
    return {}
}

export interface InsertAction {
    type: 'insert'
    block: BlockNode
    before?: BlockNode
    after?: BlockNode
}

export function insert(action: InsertAction, editor: EditorModule): Result {
    if (action.before) {
        const position = editor.stores.document.insertBeforePosition(action.before)
        const block = { ...action.block, position }

        editor.stores.fragments.push({
            [key(block)]: data(block)
        })
        return {}
    }
    if (action.after) {
        const position = editor.stores.document.insertAfterPosition(action.after)
        const block = { ...action.block, position }

        editor.stores.fragments.push({
            [key(block)]: data(block)
        })
        editor.select(block, { afterUpdate: true })
        return {}
    }

    const selection = editor.stores.selection.read()
    editor.stores.document.insertAfter(action.block, selection)
    return {}
}

export interface RemoveAction {
    type: 'remove'
    block: BlockNode
}

export function remove(action: RemoveAction, editor: EditorModule): Result {
    const { block } = action

    editor.stores.fragments.push({
        [key(block)]: null
    })
    return {}
}

export interface ReplaceAction {
    type: 'replace'
    block1: BlockNode
    block2: BlockNode
}

export function replace(action: ReplaceAction, editor: EditorModule): Result {
    const { block1, block2 } = action
    const replaceBlock = { ...block2, position: block1.position }

    editor.stores.fragments.push({
        [key(block1)]: null,
        [key(replaceBlock)]: data(replaceBlock)
    })

    editor.select(replaceBlock, { afterUpdate: true })
    return {}
}

export interface ShadowAction {
    type: 'shadow'
    block?: BlockNode
    shadow?: BlockNode
    update?: BlockDataNode
    replace?: BlockNode
    flush?: boolean
    clear?: boolean
}

export interface ShadowResult {
    block?: BlockNode
}

export function shadow(action: ShadowAction, editor: EditorModule): ShadowResult {
    if (action.clear) {
        const block = first(editor.stores.shadow.read(true))
        editor.stores.shadow.clear()
        return { block }
    }

    if (action.block && action.shadow) {
        const { block, shadow } = action
        const shadowBlock = { ...shadow, position: block.position }

        editor.stores.shadow.merge({
            [key(block)]: null,
            [key(shadowBlock)]: data(shadowBlock)
        })
        editor.select(shadowBlock, { afterUpdate: true })
        return {}
    }

    if (action.update) {
        const { update } = action
        const shadow = first(editor.stores.shadow.read())

        editor.stores.shadow.merge({
            [key(shadow)]: update
        })

        if (action.flush) {
            editor.stores.shadow.flush()
        }

        return {}
    }

    if (action.replace) {
        const { replace } = action
        const shadow = first(editor.stores.shadow.read())
        const replaceShadowBlock = { ...replace, position: shadow.position }

        editor.stores.shadow.merge({
            [key(shadow)]: null,
            [key(replaceShadowBlock)]: data(replaceShadowBlock)
        })

        if (action.flush) {
            editor.stores.shadow.flush()
        }

        return {}
    }

    if (action.flush) {
        editor.stores.shadow.flush()
        return {}
    }

    return {}
}

export interface PromptAction {
    type: 'prompt'
    placeholder: string
    run: (value: string, block: BlockNode) => void
}

export function prompt(action: PromptAction, editor: EditorModule): Result {
    const { placeholder, run } = action

    const selection = editor.stores.selection.read()
    let spacerBlock = editor.stores.document.first(
        selection.filter((b) => b.blockType === 'spacer')
    )

    if (!spacerBlock) {
        const position = editor.stores.document.insertAfterPosition(selection)
        spacerBlock = createSpacerBlock(position)
        editor.stores.fragments.push({
            [key(spacerBlock)]: data(spacerBlock)
        })
    }

    const promptBlock = createPromptBlock(placeholder, run, spacerBlock.position)
    editor.stores.shadow.merge({
        [key(spacerBlock)]: null,
        [key(promptBlock)]: data(promptBlock)
    })
    editor.select(promptBlock, { afterUpdate: true })
    return {}
}
