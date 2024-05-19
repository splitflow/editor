import { merge } from '@splitflow/core/utils'
import type { DocumentNode } from '../document'
import type { FragmentsStore } from '../stores/document/fragments'
import { idb, schema } from '../kit'

export interface StorageOptions {
    documentId: string
}

export function storage(fragments: FragmentsStore, { documentId }: StorageOptions) {
    // service does nothing if no documentId has been configured
    if (!documentId) return undefined

    const run = queue()
    let position = 1 // skip server snapshots

    function run1($fragments: DocumentNode[]) {
        run(async () => {
            const source = mergeFragments($fragments.slice(position))

            if (source) {
                const docKey = `accounts/_/editors/_/documents/${documentId}/doc`

                const db = await idb(indexedDB.open('sf-editor'), schema)
                const tx = db.transaction('doc', 'readwrite')
                tx.objectStore('doc').get(docKey).onsuccess = (event) => {
                    const target = (event.target as IDBRequest).result

                    const node = merge(target, source, { deleteNullProps: true })
                    tx.objectStore('doc').put(node, docKey)
                }
                await idb(tx)
            }

            position = $fragments.length
        })
    }

    const unsubscribe1 = fragments.subscribe(run1)
    return () => unsubscribe1()
}

function mergeFragments(fragments: DocumentNode[]) {
    if (fragments.length === 0) return null
    if (fragments.length === 1) return fragments[0]
    return fragments.reduce<DocumentNode>(merge, {})
}

const queue = () => {
    let pending = Promise.resolve()

    const run = async (task) => {
        try {
            await pending
        } catch (error) {
            console.log(error)
        } finally {
            return task()
        }
    }

    // update pending promise so that next task could await for it
    return (task) => (pending = run(task))
}
