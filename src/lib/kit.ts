import {
    ListDocumentsEndpoint,
    type ListDocumentsAction,
    type ListDocumentsResult,
    type CreateDocumentAction,
    CreateDocumentEndpoint,
    type CreateDocumentResult
} from '@splitflow/lib/editor'
import type { EditorKit } from './editor-module'
import { actionRequestX, getResult } from '@splitflow/lib'

export async function createDocument(kit: EditorKit): Promise<CreateDocumentResult> {
    const { accountId, moduleId: editorId } = kit.config

    if (accountId && editorId) {
        const action: CreateDocumentAction = {
            type: 'create-document',
            accountId,
            editorId,
            documentId: crypto.randomUUID()
        }
        const response = kit.gateway.fetch(actionRequestX(action, CreateDocumentEndpoint))
        return getResult<CreateDocumentResult>(response)
    }
    return {}
}

export async function listDocuments(kit: EditorKit): Promise<ListDocumentsResult> {
    const { accountId, moduleId: editorId } = kit.config

    if (accountId && editorId) {
        const action: ListDocumentsAction = { type: 'list-documents', accountId, editorId }
        const response = kit.gateway.fetch(actionRequestX(action, ListDocumentsEndpoint))
        return getResult<ListDocumentsResult>(response)
    }
    return {}
}
