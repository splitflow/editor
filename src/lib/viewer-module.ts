import createFragmentsStore, { type FragmentsStore } from './stores/document/fragments'
import createDocumentStore, { type DocumentStore } from './stores/document/document'
import type { BlockNode } from './document'
import type { Readable } from 'svelte/store'
import { getDefaultApp, type SplitflowApp } from '@splitflow/app'
import { createDesigner, type SplitflowDesigner } from '@splitflow/designer'
import gateway from './services/gateway'
import { storage } from './services/storage'
import { firstError, type Error } from '@splitflow/lib'

interface Stores {
    fragments: FragmentsStore
    document: DocumentStore
}

interface Services {
    gateway?: { boot: () => Promise<{ error?: Error }>; destroy: () => void }
    storage?: { boot: () => Promise<{ error?: Error }>; destroy: () => void }
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

    const designer = createDesigner({ ...config, remote: true }, undefined, undefined, app.designer)

    let fragments: FragmentsStore

    const stores: Stores = {
        fragments: (fragments = createFragmentsStore()),
        document: createDocumentStore(fragments)
    }

    const services: Services = {
        gateway: !config.local ? gateway(fragments, config.documentId) : undefined,
        storage: config.local ? storage(fragments, config.documentId) : undefined
    }

    return new ViewerModule(designer, stores, services, config)
}

export class ViewerModule {
    constructor(
        designer: SplitflowDesigner,
        stores: Stores,
        services: Services,
        config: ViewerConfig
    ) {
        this.designer = designer
        this.stores = stores
        this.services = services
        this.config = config
    }

    designer: SplitflowDesigner
    stores: Stores
    services: Services
    config: ViewerConfig
    #initialize: Promise<{ viewer?: ViewerModule; error?: Error }>

    async initialize(): Promise<{ viewer?: ViewerModule; error?: Error }> {
        return (this.#initialize ??= (async () => {
            const result1 = await this.designer.initialize()
            const result2 = await this.services.gateway?.boot()
            const result3 = await this.services.storage?.boot()

            const errorResult = firstError([result1, result2, result3])
            if (errorResult) return errorResult

            return { viewer: this }
        })())
    }

    destroy() {
        this.services.gateway?.destroy()
        this.services.storage?.destroy()
    }

    get document(): Readable<BlockNode[]> {
        return this.stores.document
    }
}
