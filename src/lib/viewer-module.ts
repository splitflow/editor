import createFragmentsStore, { type FragmentsStore } from './stores/document/fragments'
import createDocumentStore, { type DocumentStore } from './stores/document/document'
import type { BlockNode } from './document'
import type { Readable } from 'svelte/store'
import { createGateway, getDefaultApp, type Gateway, type SplitflowApp } from '@splitflow/app'
import { createDesigner, type SplitflowDesigner } from '@splitflow/designer'
import { type Error, firstError } from '@splitflow/lib'
import { createExtensionManager, type ExtensionMananger } from './extension'
import {
    loadEditorBundle,
    type EditorBundle,
    type DocumentBundle,
    type DocumentOptions,
    loadDocumentBundle,
    isDocumentBundle
} from './loaders'

interface Stores {
    fragments: FragmentsStore
    document: DocumentStore
}

export interface ViewerConfig {
    moduleName?: string
    moduleId?: string
    documentId?: string
    documentKey?: string
    local?: boolean
}

export function createViewer(config?: ViewerConfig, app?: SplitflowApp) {
    app ??= getDefaultApp()
    config = { ...app.config, moduleName: 'editor', ...config }

    const gateway = createGateway()
    const designer = createDesigner({ ...config, remote: true }, undefined, undefined, app.designer)
    const extension = createExtensionManager()

    let fragments: FragmentsStore

    const stores: Stores = {
        fragments: (fragments = createFragmentsStore()),
        document: createDocumentStore(fragments)
    }

    return new ViewerModule(gateway, designer, extension, stores, config)
}

export class ViewerModule {
    constructor(
        gateway: Gateway,
        designer: SplitflowDesigner,
        extension: ExtensionMananger,
        stores: Stores,
        config: ViewerConfig
    ) {
        this.gateway = gateway
        this.designer = designer
        this.extension = extension
        this.stores = stores
        this.config = config
    }

    gateway: Gateway
    designer: SplitflowDesigner
    extension: ExtensionMananger
    stores: Stores
    config: ViewerConfig
    #initialize: Promise<{ viewer?: ViewerModule; error?: Error }>

    async initialize(data?: EditorBundle): Promise<{ viewer?: ViewerModule; error?: Error }> {
        return (this.#initialize ??= (async () => {
            data ??= await loadEditorBundle(this.config)

            const error = firstError(data)
            if (error) return { error }

            this.designer.initialize(data)
            return { viewer: this }
        })())
    }

    async updateDocument(data: DocumentBundle | DocumentOptions): Promise<{ error?: Error }> {
        data = isDocumentBundle(data) ? data : await loadDocumentBundle(this.gateway, this.config, data)

        const error = firstError(data)
        if (error) return { error }

        const { document } = data.getDocumentResult
        this.stores.fragments.init(document)
        return {}
    }

    destroy() {}

    get document(): Readable<BlockNode[]> {
        return this.stores.document
    }
}
