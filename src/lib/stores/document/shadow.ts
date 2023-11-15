import { merge as mergeObject, type MergeOption } from '@splitflow/core/utils'
import { writable, type Readable } from 'svelte/store'
import type { DocumentNode } from '../../document'
import type { FragmentsStore } from './fragments'

export interface ShadowStore extends Readable<DocumentNode> {
    merge(node: DocumentNode): void
    clear(): void
    flush(): void
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

    return { subscribe, merge, clear, flush }
}
