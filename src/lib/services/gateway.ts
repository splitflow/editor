import { merge } from '@splitflow/core/utils'
import { actionRequestX, getResult } from '@splitflow/lib'
import { type MergeDocumentAction, MergeDocumentEndpoint } from '@splitflow/lib/editor'
import type { DocumentNode } from '../document'
import type { FragmentsStore } from '../stores/document/fragments'
import type { Gateway } from '@splitflow/app'

export interface GatewayOptions {
    accountId?: string
    moduleId?: string
    documentId?: string
}

export default function gateway(
    gateway: Gateway,
    fragments: FragmentsStore,
    options: GatewayOptions
) {
    const { accountId, moduleId: editorId, documentId } = options
    // service does nothing if no documentId has been configured
    if (!accountId || !editorId || !documentId) return undefined

    const run = queue()
    let position = 1 // skip server snapshots

    function run1($fragments: DocumentNode[]) {
        run(async () => {
            const document = mergeFragments($fragments.slice(position))

            if (document) {
                const action: MergeDocumentAction = {
                    type: 'merge-document',
                    accountId,
                    editorId,
                    documentId,
                    document
                }
                const response = gateway.fetch(actionRequestX(action, MergeDocumentEndpoint))
                await getResult(response)
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
