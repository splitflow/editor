import createFragmentsStore, { type FragmentsStore } from './stores/document/fragments'
import createDocumentStore, { type DocumentStore } from './stores/document/document'
import type { BlockNode } from './document'
import type { Readable } from 'svelte/store'
import { getDefaultApp, type Gateway, type SplitflowApp } from '@splitflow/app'
import { createDesigner, type SplitflowDesigner } from '@splitflow/designer'
import { type Error, firstError } from '@splitflow/lib'
import { createExtensionManager, type ExtensionMananger } from './extension'
import {
    type EditorBundle,
    type DocumentBundle,
    type DocumentOptions,
    loadDocumentBundle,
    isDocumentBundle,
    isFulfilled,
    isEditorBundle
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

export function createViewer(init: ViewerConfig | EditorBundle, app?: SplitflowApp) {
    app ??= getDefaultApp()

    const bundle = isEditorBundle(init) ? init : undefined
    const config = isEditorBundle(init)
        ? init.config
        : { ...app.config, moduleName: 'Editor', ...init }

    const { gateway } = app
    const designer = createDesigner(
        bundle ?? { ...config, moduleType: 'editor', remote: true },
        undefined,
        undefined,
        app.designer
    )
    const extension = createExtensionManager()

    let fragments: FragmentsStore
    const stores: Stores = {
        fragments: (fragments = createFragmentsStore()),
        document: createDocumentStore(fragments)
    }

    return new ViewerModule(gateway, designer, extension, stores, config, bundle)
}

export class ViewerModule {
    constructor(
        gateway: Gateway,
        designer: SplitflowDesigner,
        extension: ExtensionMananger,
        stores: Stores,
        config: ViewerConfig,
        bundle: EditorBundle
    ) {
        this.gateway = gateway
        this.designer = designer
        this.extension = extension
        this.stores = stores
        this.config = config
        this.bundle = bundle
    }

    gateway: Gateway
    designer: SplitflowDesigner
    extension: ExtensionMananger
    stores: Stores
    config: ViewerConfig
    bundle: EditorBundle

    #initialize: Promise<{ editor?: ViewerModule; error?: Error }>

    async initialize(): Promise<{ editor?: ViewerModule; error?: Error }> {
        return (this.#initialize ??= (async () => {
            // editor bundle contains only designer data for now
            // designer will do the loading itself if no bundle as been pre-fetched

            const { error } = await this.designer.initialize()
            if (error) return { error }

            this.bundle = undefined
            return { editor: this }
        })())
    }

    async updateDocument(bundle: DocumentBundle | DocumentOptions): Promise<{ error?: Error }> {
        if (isDocumentBundle(bundle)) {
            bundle = isFulfilled(bundle) ? bundle : await loadDocumentBundle(this, bundle.options)
        } else {
            bundle = await loadDocumentBundle(this, bundle)
        }

        const error = firstError(bundle)
        if (error) return { error }

        if (bundle.getDocResult) {
            const { doc } = bundle.getDocResult
            this.stores.fragments.init(doc)
        }
        return {}
    }

    destroy() {}

    get document(): Readable<BlockNode[]> {
        return this.stores.document
    }
}
