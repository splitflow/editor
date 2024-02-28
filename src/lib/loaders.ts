import { actionRequestX, getResult } from '@splitflow/lib'
import {
    GetDocumentEndpoint,
    type GetDocumentAction,
    type GetDocumentResult
} from '@splitflow/lib/editor'
import type { EditorKit } from './editor-module'
import { loadSplitflowDesignerData, type SplitflowDesignerData } from '@splitflow/designer'

export interface EditorData extends SplitflowDesignerData {}

export function loadEditorData(kit: EditorKit) {
    return loadSplitflowDesignerData(kit.designer)
}

export interface DocumentData {
    options: DocumentOptions
    getDocumentResult?: GetDocumentResult
}

export interface DocumentOptions {
    documentId: string
}

export function isDocumentData(data: DocumentData | DocumentOptions): data is DocumentData {
    return !!(data as any).getDocumentResult
}

export async function loadDocumentData(
    kit: EditorKit,
    options: DocumentOptions
): Promise<DocumentData> {
    if (kit.config.local) return loadLocalDocumentData(options)
    return loadRemoteDocumentData(kit, options)
}

async function loadRemoteDocumentData(
    kit: EditorKit,
    options: DocumentOptions
): Promise<DocumentData> {
    const { accountId, moduleId: editorId } = kit.config
    const { documentId } = options

    if (accountId && editorId && documentId) {
        const action: GetDocumentAction = { type: 'get-document', accountId, editorId, documentId }
        const response = kit.gateway.fetch(actionRequestX(action, GetDocumentEndpoint))
        const getDocumentResult = await getResult<GetDocumentResult>(response)
        return { options, getDocumentResult }
    }
    return { options }
}

async function loadLocalDocumentData(options: DocumentOptions): Promise<DocumentData> {
    const { documentId } = options

    if (documentId) {
        const item = localStorage.getItem(
            `sf/accounts/_/editors/_/documents/${documentId}/doc.json`
        )
        const document = item ? JSON.parse(item) : undefined

        if (document) {
            return { options, getDocumentResult: { document } }
        }
        
        const error: GetDocumentResult['error'] = {
            code: 'unknown-document',
            message: "we didn't find your document"
        }
        return { options, getDocumentResult: { error } }
    }
    return { options, getDocumentResult: undefined }
}
