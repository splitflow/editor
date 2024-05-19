import { actionRequestX, getResult } from '@splitflow/lib'
import { GetDocEndpoint, type GetDocAction, type GetDocResult } from '@splitflow/lib/editor'
import type { EditorConfig, EditorKit } from './editor-module'
import { loadSplitflowDesignerBundle, type DesignerBundle } from '@splitflow/designer'
import { schema, idb } from './kit'

const browser = typeof document !== 'undefined'

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
    getDocResult?: GetDocResult
}

export interface DocumentOptions {
    documentId: string
}

export function isDocumentBundle(
    bundle: DocumentBundle | DocumentOptions
): bundle is DocumentBundle {
    return !!(bundle as any).options
}

export function isFulfilled(bundle: DocumentBundle) {
    return !!bundle.getDocResult
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
        const action: GetDocAction = { type: 'get-doc', accountId, editorId, documentId }
        const response = kit.gateway.fetch(actionRequestX(action, GetDocEndpoint))
        const getDocResult = await getResult<GetDocResult>(response)
        return { options, getDocResult }
    }
    return { options }
}

async function loadLocalDocumentBundle(options: DocumentOptions): Promise<DocumentBundle> {
    const { documentId } = options

    if (browser && documentId) {
        const docKey = `accounts/_/editors/_/documents/${documentId}/doc`
        
        const db = await idb(indexedDB.open('sf-editor'), schema)
        const doc = await idb(db.transaction('doc').objectStore('doc').get(docKey))
        if (doc) return { options, getDocResult: { doc } }

        const error: GetDocResult['error'] = {
            code: 'unknown-document',
            message: "we didn't find your document"
        }
        return { options, getDocResult: { error } }
    }
    return { options }
}
