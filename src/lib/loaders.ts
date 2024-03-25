import { actionRequestX, getResult } from '@splitflow/lib'
import {
    GetDocumentEndpoint,
    type GetDocumentAction,
    type GetDocumentResult
} from '@splitflow/lib/editor'
import type { EditorConfig, EditorKit } from './editor-module'
import { loadSplitflowDesignerBundle, type DesignerBundle } from '@splitflow/designer'

export interface EditorBundle extends DesignerBundle {
    config: EditorConfig
}

export function isEditorBundle(bundle: EditorBundle | EditorConfig): bundle is EditorBundle {
    return !!(bundle as any).config
}

export async function loadEditorBundle(kit: EditorKit): Promise<EditorBundle> {
    const bundle1 = await loadSplitflowDesignerBundle(kit.designer)
    return { config: kit.config, ...bundle1 }
}

export interface DocumentBundle {
    options: DocumentOptions
    getDocumentResult?: GetDocumentResult
}

export interface DocumentOptions {
    documentId: string
}

export function isDocumentBundle(
    bundle: DocumentBundle | DocumentOptions
): bundle is DocumentBundle {
    return !!(bundle as any).getDocumentResult
}

export async function loadDocumentBundle(
    kit: EditorKit,
    options: DocumentOptions
): Promise<DocumentBundle> {
    if (kit.config.local) return loadLocalDocumentBundle(options)
    return loadRemoteDocumentBundle(kit, options)
}

async function loadRemoteDocumentBundle(
    kit: EditorKit,
    options: DocumentOptions
): Promise<DocumentBundle> {
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

async function loadLocalDocumentBundle(options: DocumentOptions): Promise<DocumentBundle> {
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
    return { options }
}
