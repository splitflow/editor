import { writable, type Readable } from 'svelte/store'
import { createDocument, type DocumentNode } from '../../document'

export interface FragmentsStore extends Readable<DocumentNode[]> {
    push: (fragment: DocumentNode) => void
    init: (fragment: DocumentNode) => void
}

export default function createFragmentsStore(): FragmentsStore {
    const { subscribe, update, set } = writable<DocumentNode[]>([
        createDocument() // server fragment
    ])

    function push(fragment: DocumentNode) {
        if (fragment) {
            update((fragments) => [...fragments, fragment])
        }
    }

    function init(fragment: DocumentNode) {
        set([createDocument(fragment)])
    }

    return { subscribe, push, init }
}
