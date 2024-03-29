import { writable, type Readable } from 'svelte/store'
import type { DocumentNode } from '../../document'

export interface FragmentsStore extends Readable<DocumentNode[]> {
    push: (fragment: DocumentNode) => void
    register: (fragment: DocumentNode) => void
    init: (fragment: DocumentNode) => void
}

export default function createFragmentsStore(): FragmentsStore {
    const { subscribe, update, set } = writable<DocumentNode[]>([
        {} // server fragment
    ])

    function push(fragment: DocumentNode) {
        if (fragment) {
            update((fragments) => [...fragments, fragment])
        }
    }

    function register(fragment: DocumentNode) {
        if (fragment) {
            update((fragments) => [fragment, ...fragments.slice(1)])
        }
    }

    function init(fragment: DocumentNode) {
        set([fragment ?? {}])
    }

    return { subscribe, push, register, init }
}
