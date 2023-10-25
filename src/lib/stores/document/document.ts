import { writable, type Readable } from 'svelte/store'
import { merge } from '@splitflow/core/utils'
import {
    key,
    data as blockData,
    type BlockNode,
    parseKey,
    type DocumentNode,
    insertPosition
} from '../../document'
import type { FragmentsStore } from './fragments'

export interface DocumentStore extends Readable<BlockNode[]> {
    insertAfter: (block: BlockNode, beforeBlock: BlockNode | BlockNode[]) => void
    insertAfterPosition: (block: BlockNode) => number
    insertBeforePosition: (block: BlockNode) => number
}

interface SnapshotNode {
    [key: string]: BlockNode
}

export default function createDocumentStore(fragments: FragmentsStore): DocumentStore {
    let documentSnapshot: SnapshotNode = {}
    let value: BlockNode[]
    let position = 0
    let synced = false

    const { subscribe } = writable<BlockNode[]>(value, (set) => {
        const unsubscribe = fragments.subscribe(($fragments) => {
            let newFragments = $fragments.slice(position)
            if (newFragments.length === 0) {
                // there are no new fragments
                // server AST snapshot has been updated
                // we have to recompute all AST fragments
                newFragments = $fragments
            }

            const snapshot = mergeASTFragments(newFragments)
            documentSnapshot = mergeSnapshot(documentSnapshot, snapshot)
            position = $fragments.length

            set((value = Object.values(documentSnapshot).sort(sortBlocks)))
        })

        synced = true
        return () => {
            unsubscribe()
            synced = false
        }
    })

    function sync() {
        if (!synced) subscribe(() => {})()
    }

    function insertAfter(block: BlockNode, beforeBlock: BlockNode | BlockNode[]) {
        sync()
        beforeBlock = Array.isArray(beforeBlock) ? last(value, beforeBlock) : beforeBlock
        const position = insertAfterPosition(value, beforeBlock)
        fragments.push({ [key(block)]: blockData({ ...block, position }) })
    }

    function _insertAfterPosition(block: BlockNode) {
        sync()
        return insertAfterPosition(value, block)
    }

    function _insertBeforePosition(block: BlockNode) {
        sync()
        return insertBeforePosition(value, block)
    }

    return {
        subscribe,
        insertAfter,
        insertAfterPosition: _insertAfterPosition,
        insertBeforePosition: _insertBeforePosition
    }
}

export function after(document: BlockNode[], block: BlockNode) {
    const [index] = findEntry(document, block)
    return index && document[index + 1]
}

export function before(document: BlockNode[], block: BlockNode) {
    const [index] = findEntry(document, block)
    return index && document[index - 1]
}

export function last(document: BlockNode[], blocks: BlockNode[]) {
    let last: BlockNode

    for (const block of blocks) {
        const [, docBloc] = findEntry(document, block)
        if (docBloc.position > (last?.position ?? 0)) {
            console.log('LAST')
            last = docBloc
        }
    }
    return last
}

export function insertAfterPosition(document: BlockNode[], block: BlockNode) {
    const [index] = findEntry(document, block)
    return insertPosition(document[index]?.position, document[index + 1]?.position)
}

export function insertBeforePosition(document: BlockNode[], block: BlockNode) {
    const [index] = findEntry(document, block)
    return insertPosition(document[index - 1]?.position, document[index]?.position)
}

function mergeASTFragments(fragments: DocumentNode[]): DocumentNode {
    if (fragments.length === 0) return null
    if (fragments.length === 1) return fragments[0]
    return fragments.reduce(merge, {})
}

function mergeSnapshot(snapshot: SnapshotNode, fragment: DocumentNode) {
    if (!fragment) return snapshot

    const result = merge(snapshot, fragment as any, {
        deleteNullProps: true
    }) as SnapshotNode
    for (const [key, block] of Object.entries(result)) {
        if (!block.blockId || !block.blockType) {
            // mutate only newly created blocks
            const { blockId, blockType } = parseKey(key)
            block.blockId = blockId
            block.blockType = blockType
        }
    }
    return result
}

function sortBlocks(block1: BlockNode, block2: BlockNode) {
    return block1.position - block2.position
}

function findEntry(document: BlockNode[], block: BlockNode): [number, BlockNode] {
    for (const [index, docBlock] of document.entries()) {
        if (docBlock.blockType === block.blockType && docBlock.blockId === block.blockId)
            return [index, docBlock]
    }
}
