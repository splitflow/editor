import { merge as mergeObject, type MergeOption } from '@splitflow/core/utils'
import { writable, type Readable } from 'svelte/store'
import { parseKey, type DocumentNode, type BlockNode } from '../../document'
import type { FragmentsStore } from './fragments'

export interface ShadowStore extends Readable<DocumentNode> {
    merge(node: DocumentNode, options?: MergeOption): void
    clear(): void
    flush(): void
    read(shadowed?: boolean): BlockNode[]
}

export default function createShadowStore(fragments: FragmentsStore): ShadowStore {
    let value: DocumentNode

    const { subscribe, set } = writable(value)

    function merge(node: Partial<DocumentNode>, options?: MergeOption) {
        set((value = mergeObject(value, node, options) ?? undefined))
    }

    function clear() {
        set((value = undefined))
    }

    function flush() {
        fragments.push(value)
        set((value = undefined))
    }

    function read(shadowed = false) {
        return readShadow(value, shadowed)
    }

    return { subscribe, merge, clear, flush, read }
}

export function readShadow(value: DocumentNode, shadowed: boolean) {
    if (!value) return []

    if (shadowed) {
        return Object.entries(value)
            .filter(([, data]) => data === null)
            .map(([key]) => parseKey(key))
    }

    return Object.entries(value)
        .filter(([, data]) => !!data)
        .map(([key, data]) => ({ ...parseKey(key), ...data }))
}
