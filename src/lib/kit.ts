import {
    ListDocumentsEndpoint,
    type ListDocumentsAction,
    type ListDocumentsResult,
    type CreateDocumentAction,
    CreateDocumentEndpoint,
    type CreateDocumentResult,
    type UpdateDocumentResult,
    type UpdateDocumentAction,
    UpdateDocumentEndpoint
} from '@splitflow/lib/editor'
import type { EditorKit } from './editor-module'
import { actionRequestX, getResult } from '@splitflow/lib'

const browser = typeof document !== 'undefined'

export function createDocument(kit: EditorKit) {
    if (kit.config.local) return createLocalDocument()
    return createRemoteDocument(kit)
}

export interface UpdateDocumentOptions {
    documentId: string
    name?: string
}

export function updateDocument(kit: EditorKit, options: UpdateDocumentOptions) {
    if (kit.config.local) return updateLocalDocument(options)
    return updateRemoteDocument(kit, options)
}

export function listDocuments(kit: EditorKit) {
    if (kit.config.local) return listLocalDocuments()
    return listRemoteDocuments(kit)
}

export async function createRemoteDocument(kit: EditorKit): Promise<CreateDocumentResult> {
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
}

export async function updateRemoteDocument(
    kit: EditorKit,
    options: UpdateDocumentOptions
): Promise<UpdateDocumentResult> {
    const { accountId, moduleId: editorId } = kit.config
    const { documentId, name } = options

    if (accountId && editorId) {
        const action: UpdateDocumentAction = {
            type: 'update-document',
            accountId,
            editorId,
            documentId,
            name
        }
        const response = kit.gateway.fetch(actionRequestX(action, UpdateDocumentEndpoint))
        return getResult<UpdateDocumentResult>(response)
    }
}

export async function listRemoteDocuments(kit: EditorKit): Promise<ListDocumentsResult> {
    const { accountId, moduleId: editorId } = kit.config

    if (accountId && editorId) {
        const action: ListDocumentsAction = { type: 'list-documents', accountId, editorId }
        const response = kit.gateway.fetch(actionRequestX(action, ListDocumentsEndpoint))
        return getResult<ListDocumentsResult>(response)
    }
}

export async function createLocalDocument() {
    if (browser) {
        const documentId = crypto.randomUUID()
        const docKey = `accounts/_/editors/_/documents/${documentId}/doc`
        const document = { documentId }
        const doc = {
            'paragraph:0.794138628217451': {
                position: 4000002000,
                markdown: 'sss'
            }
        }

        const db = await idb(indexedDB.open('sf-editor'), schema)
        const tx = db.transaction(['document', 'doc'], 'readwrite')
        await Promise.all([
            idb(tx.objectStore('document').add(document)),
            idb(tx.objectStore('doc').add(doc, docKey))
        ])

        return { document }
    }
}

export async function updateLocalDocument(options: UpdateDocumentOptions) {
    if (browser) {
        const { documentId, name } = options

        const db = await idb(indexedDB.open('sf-editor'), schema)
        const tx = db.transaction('document', 'readwrite')

        tx.objectStore('document').get(documentId).onsuccess = (event) => {
            const document = (event.target as IDBRequest).result
            tx.objectStore('document').put({ ...document, name })
        }
        await idb(tx)

        return { document }
    }
}

export async function listLocalDocuments() {
    if (browser) {
        const db = await idb(indexedDB.open('sf-editor'), schema)
        const tx = db.transaction('document')
        const documents = await idb<Document>(tx.objectStore('document').openCursor())
        return { documents }
    }
}

export function schema(event: Event) {
    const db = (event.target as IDBOpenDBRequest).result
    db.createObjectStore('document', { keyPath: 'documentId' })
    db.createObjectStore('doc', { autoIncrement: false })
}

function isIDBTransaction(value: IDBTransaction | IDBRequest): value is IDBTransaction {
    return (value as any)?.db !== undefined
}

function isIDBCursorWithValue(value: unknown): value is IDBCursorWithValue {
    return (value as any)?.direction !== undefined
}

export function idb(
    request: IDBOpenDBRequest,
    onupgradeneeded?: (event: IDBVersionChangeEvent) => void
): Promise<IDBDatabase>
export function idb<T>(request: IDBRequest<IDBCursorWithValue>): Promise<T[]>
export function idb<T>(request: IDBRequest<T>): Promise<T>
export function idb<T>(transaction: IDBTransaction): Promise<void>
export function idb(
    arg: IDBTransaction | IDBRequest,
    onupgradeneeded?: (event: IDBVersionChangeEvent) => void
) {
    const transaction = isIDBTransaction(arg) ? arg : arg.transaction
    const request = isIDBTransaction(arg) ? undefined : arg

    if (request && !transaction) {
        // IDBOpenDBRequest
        return new Promise((resolve, reject) => {
            request.addEventListener('upgradeneeded', onupgradeneeded)

            request.addEventListener('success', () => {
                resolve(request.result)
            })

            request.addEventListener('error', () => {
                reject(request.error)
            })
        })
    }

    return new Promise((resolve, reject) => {
        let cursorResult: any[]
        let result: any

        request?.addEventListener('success', () => {
            if (isIDBCursorWithValue(request.result)) {
                const cursor = request.result

                cursorResult ??= []
                cursorResult.push(cursor.value)
                cursor.continue()
            } else {
                result = request.result
            }
        })

        transaction.addEventListener('complete', () => {
            resolve(cursorResult ?? result)
        })

        transaction.addEventListener('abort', () => {
            reject(transaction.error)
        })
    })
}

export function idb5(
    request: IDBOpenDBRequest,
    onupgradeneeded?: (event: IDBVersionChangeEvent) => void
) {
    return new Promise<IDBDatabase>((resolve, reject) => {
        request.onupgradeneeded = onupgradeneeded

        request.onsuccess = () => {
            resolve(request.result)
        }

        request.onerror = (event) => {
            reject(event)
        }
    })
}

export function idb2<T>(request: IDBRequest<IDBCursorWithValue>) {
    const array: T[] = []

    return new Promise<T[]>((resolve, reject) => {
        request.transaction.oncomplete = () => {
            console.log('complete')
            resolve(array)
        }

        request.onsuccess = () => {
            const cursor = request.result
            console.log('success')
            if (cursor) {
                array.push(cursor.value)
                cursor.continue()
            }
        }

        request.onerror = (event) => {
            reject(event)
        }
    })
}

export function idb3<T>(request: IDBRequest<T>) {
    let res: T

    return new Promise<T>((resolve, reject) => {
        request.transaction.oncomplete = () => {
            console.log('complete')
            resolve(res)
        }

        request.onsuccess = () => {
            console.log('success')
            res = request.result
        }

        request.onerror = (event) => {
            reject(event)
        }
    })
}
