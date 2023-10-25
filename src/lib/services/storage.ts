import { merge } from '@splitflow/core/utils'
import type { DocumentNode } from '../document'
import type { FragmentsStore } from '../stores/document/fragments'

export function storage(fragments: FragmentsStore, documentId: string) {
    // service does nothing if no documentId has been configured
    if (!documentId) return { boot: async () => ({}), destroy: () => {} }

    let position = 1 // skip server snapshots
    let unsubscribe1: () => void

    async function boot() {
        const item = localStorage.getItem(`sf/editor/document/${documentId}.node.json`)
        const node = item ? JSON.parse(item) : undefined

        if (node) {
            fragments.register(node) // register server snapshot
            unsubscribe1 = fragments.subscribe(run1)
            return {}
        }

        const error = { code: 'not-found', message: "we didn't find your document" }
        return { error }
    }

    function run1($fragments: DocumentNode[]) {
        const source = mergeFragments($fragments.slice(position))

        if (source) {
            const item = localStorage.getItem(`sf/editor/document/${documentId}.node.json`)
            const target = item ? JSON.parse(item) : undefined
            const node = merge(target, source, { deleteNullProps: true })

            localStorage.setItem(`sf/editor/document/${documentId}.node.json`, JSON.stringify(node))
        }

        position = $fragments.length
    }

    return {
        boot,
        destroy: () => {
            unsubscribe1?.()
        }
    }
}

function mergeFragments(fragments: DocumentNode[]) {
    if (fragments.length === 0) return null
    if (fragments.length === 1) return fragments[0]
    return fragments.reduce<DocumentNode>(merge, {})
}
