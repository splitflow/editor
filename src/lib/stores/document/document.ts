import { writable, type Readable } from 'svelte/store'
import { merge, mergeWithOption } from '@splitflow/core/utils'
import {
    key,
    data as blockData,
    type BlockNode,
    parseKey,
    type DocumentNode,
    insertPosition
} from '../../document'
import type { FragmentsStore } from './fragments'
import type { ShadowStore } from './shadow'

export interface DocumentStore extends Readable<BlockNode[]> {
    first(blocks: BlockNode[]): BlockNode
    last(blocks: BlockNode[]): BlockNode
    insertAfter(block: BlockNode, beforeBlock: BlockNode | BlockNode[]): void
    insertAfterPosition(block: BlockNode | BlockNode[]): number
    insertBeforePosition(block: BlockNode | BlockNode[]): number
}

interface SnapshotNode {
    [key: string]: BlockNode
}

export default function createDocumentStore(
    fragments: FragmentsStore,
    shadow?: ShadowStore
): DocumentStore {
    let value: BlockNode[]
    let fragmentsSnapshot: SnapshotNode
    let shadowSnapshot: SnapshotNode
    let position = 0
    let synced = false

    const { subscribe } = writable<BlockNode[]>(value, (set) => {
        const unsubscribe1 = fragments.subscribe(($fragments) => {
            fragmentsSnapshot = snapshotFragments(fragmentsSnapshot, $fragments.slice(position))
            position = $fragments.length
            set((value = fromSnapshots(fragmentsSnapshot, shadowSnapshot)))
        })

        const unsubscribe2 = shadow?.subscribe(($shadow) => {
            shadowSnapshot = snapshotShadow(shadowSnapshot, $shadow)
            set((value = fromSnapshots(fragmentsSnapshot, shadowSnapshot)))
        })

        synced = true
        return () => {
            unsubscribe1()
            unsubscribe2?.()
            synced = false
        }
    })

    function sync() {
        if (!synced) subscribe(() => {})()
    }

    return {
        subscribe,
        first(blocks: BlockNode[]) {
            sync()
            return first(value, blocks)
        },
        last(blocks: BlockNode[]) {
            sync()
            return last(value, blocks)
        },
        insertAfter(block: BlockNode, beforeBlock: BlockNode | BlockNode[]) {
            sync()
            beforeBlock = Array.isArray(beforeBlock) ? last(value, beforeBlock) : beforeBlock
            const position = insertAfterPosition(value, beforeBlock)
            fragments.push({ [key(block)]: blockData({ ...block, position }) })
        },
        insertAfterPosition(block: BlockNode | BlockNode[]) {
            sync()
            block = Array.isArray(block) ? last(value, block) : block
            return insertAfterPosition(value, block)
        },
        insertBeforePosition(block: BlockNode | BlockNode[]) {
            sync()
            block = Array.isArray(block) ? first(value, block) : block
            return insertBeforePosition(value, block)
        }
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

export function first(document: BlockNode[], blocks: BlockNode[]) {
    let first: BlockNode

    for (const block of blocks) {
        const [, docBloc] = findEntry(document, block)
        if (docBloc.position < (first?.position ?? Number.MAX_SAFE_INTEGER)) {
            first = docBloc
        }
    }
    return first
}

export function last(document: BlockNode[], blocks: BlockNode[]) {
    let last: BlockNode

    for (const block of blocks) {
        const [, docBloc] = findEntry(document, block)
        if (docBloc.position > (last?.position ?? 0)) {
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

function snapshotFragments(snapshot: SnapshotNode, fragments: DocumentNode[]) {
    const result = fragments.reduce<SnapshotNode>(
        mergeWithOption({ deleteNullProps: true, forceUpdate: true }),
        snapshot
    )

    for (const [key, block] of Object.entries(result)) {
        if (block && (!block.blockId || !block.blockType)) {
            const { blockId, blockType } = parseKey(key)
            result[key] = { ...block, blockId, blockType }
        }
    }
    return result
}

function snapshotShadow(snapshot: SnapshotNode, fragment: DocumentNode) {
    if (!fragment) return undefined

    const result = merge(snapshot, fragment)
    for (const [key, block] of Object.entries(result)) {
        if (block && (!block.blockId || !block.blockType)) {
            const { blockId, blockType } = parseKey(key)
            result[key] = { ...block, blockId, blockType }
        }
    }
    return result
}

function fromSnapshots(fragmentsSnapshot: SnapshotNode, shadowSnapshot: SnapshotNode) {
    const snapshot = merge(fragmentsSnapshot, shadowSnapshot, { deleteNullProps: true })
    return Object.values(snapshot).sort(sortBlocks)
}

/**
 * The merge operation mutates bocks only if they have modified properties
 * We force mutate to make sure we re-sync svelte components with the block data
 * Snapshot blocks which are not modified keep the same object instance,
 * and so the svelte component marked with <svelte:options immutable={true} /> will not trigger an update.
 */
function mergeSnapshot(snapshot: SnapshotNode, fragment: DocumentNode, shadow: DocumentNode) {
    let result = snapshot ?? {}

    if (fragment) {
        for (const blockData of Object.values(fragment)) {
            // force mutate
            if (blockData) blockData._force = true
        }

        result = merge(result, fragment, {
            deleteNullProps: true
        }) as SnapshotNode
    }

    if (shadow) {
        for (const blockData of Object.values(shadow)) {
            // force mutate
            if (blockData) blockData._force = true
        }

        result = merge(result, shadow, {
            deleteNullProps: true
        }) as SnapshotNode
    }

    for (const [key, block] of Object.entries(result)) {
        if ((block as any)._force) {
            // clesn up
            delete (block as any)._force
        }

        if (!block.blockId || !block.blockType) {
            // convert new blockData in block
            const { blockId, blockType } = parseKey(key)
            result[key] = { ...block, blockId, blockType }
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
