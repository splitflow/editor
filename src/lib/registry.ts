import { derived } from 'svelte/store'
import type { DocumentStore } from './stores/document/document'
import { key, type BlockNode, isListItemNode, type ListItemNode } from './document'

export class BlockRecord {
    constructor(key: string) {
        this.key = key
    }

    block: BlockNode
    component: BlockComponent
    key: string

    get element(): HTMLElement {
        return this.component.getElement()
    }

    get isVoid() {
        return this.component.isVoid ?? false
    }

    dispatchKeydown(event: KeyboardEvent) {
        return this.component.keydown?.(event) ?? false
    }
}

export class RecordGroup {
    constructor(key: string, ordered = false) {
        this.records = []
        this.key = key
        this.ordered = ordered
    }

    records: BlockRecord[]
    ordered: boolean
    key: string
}

export interface BlockComponent {
    getElement: () => HTMLElement
    isVoid?: boolean
    keydown?: (event: KeyboardEvent) => boolean
}

export function createDocumentRegistry(document: DocumentStore) {
    let cache: { [key: string]: BlockRecord } = {}

    return derived([document], ([$document]) => {
        const rollingCache: { [key: string]: BlockRecord } = {}
        const registry: (BlockRecord | RecordGroup)[] = []

        for (const block of $document) {
            const blockKey = key(block)
            const record = cache[blockKey] ?? new BlockRecord(blockKey)
            record.block = block

            if (isListItemNode(record.block)) {
                const listRecord = getGroup(registry, record.block)
                listRecord.records.push(record)
            } else {
                registry.push(record)
            }

            rollingCache[blockKey] = record
        }
        cache = rollingCache

        function getRecord(block: BlockNode) {
            return cache[key(block)]
        }

        function findRecord(element: HTMLElement) {
            return Object.values(cache).find((r) => r.element === element)
        }

        function records() {
            return walkRecords(registry)
        }

        function read() {
            return registry
        }

        return { records, getRecord, findRecord, read }
    })
}

function* walkRecords(registry: (BlockRecord | RecordGroup)[]) {
    for (const item of registry) {
        if (item instanceof RecordGroup) {
            for (const record of item.records) {
                yield record
            }
        } else {
            yield item
        }
    }
}

function getGroup(records: (BlockRecord | RecordGroup)[], block: ListItemNode) {
    let lastRecord = records[records.length - 1]
    if (!(lastRecord instanceof RecordGroup) || lastRecord.ordered !== block.ordered) {
        lastRecord = new RecordGroup(`group-${key(block)}`, block.ordered)
        records.push(lastRecord)
    }

    return lastRecord
}
