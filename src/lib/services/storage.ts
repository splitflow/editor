import { merge } from '@splitflow/core/utils'
import type { DocumentNode } from '../document'
import type { FragmentsStore } from '../stores/document/fragments'

export interface StorageOptions {
    documentId: string
}

export function storage(fragments: FragmentsStore, { documentId }: StorageOptions) {
    // service does nothing if no documentId has been configured
    if (!documentId) return undefined

    let position = 1 // skip server snapshots

    function run1($fragments: DocumentNode[]) {
        const source = mergeFragments($fragments.slice(position))

        if (source) {
            const item = localStorage.getItem(
                `sf/accounts/_/editors/_/documents/${documentId}/doc.json`
            )
            const target = item ? JSON.parse(item) : undefined
            const node = merge(target, source, { deleteNullProps: true })

            localStorage.setItem(
                `sf/accounts/_/editors/_/documents/${documentId}/doc.json`,
                JSON.stringify(node)
            )
        }

        position = $fragments.length
    }

    const unsubscribe1 = fragments.subscribe(run1)
    return () => unsubscribe1()
}

function mergeFragments(fragments: DocumentNode[]) {
    if (fragments.length === 0) return null
    if (fragments.length === 1) return fragments[0]
    return fragments.reduce<DocumentNode>(merge, {})
}
