import { merge } from '@splitflow/core/utils'
import { actionRequest, getResult } from '@splitflow/lib'
import type { GetNodeAction, GetNodeResult, MergeNodeAction } from '@splitflow/lib/editor'
import type { DocumentNode } from '../document'
import type { FragmentsStore } from '../stores/document/fragments'

export default function gateway(fragments: FragmentsStore, documentId: string, persistent = true) {
    // service does nothing if no documentId has been configured
    if (!documentId) return { boot: async () => ({}), destroy: () => {} }

    const run = queue()
    let position = 1 // skip server snapshots
    let unsubscribe1: () => void

    async function boot() {
        const action: GetNodeAction = { type: 'get-node', documentId }
        const response = fetch(actionRequest('editor', action))
        const { node, error } = await getResult<GetNodeResult>(response)

        if (error) return { error }

        fragments.register(node) // register server snapshot
        if (persistent) {
            unsubscribe1 = fragments.subscribe(run1)
        }
        return {}
    }

    function run1($fragments: DocumentNode[]) {
        run(async () => {
            const node = mergeFragments($fragments.slice(position))

            if (node) {
                const action: MergeNodeAction = { type: 'merge-node', documentId, node }
                const response = fetch(actionRequest('editor', action))
                await getResult(response)
            }

            position = $fragments.length
        })
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
