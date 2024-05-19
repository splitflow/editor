import { afterUpdate, getContext, onMount } from 'svelte'
import createFragmentsStore, { type FragmentsStore } from './stores/document/fragments'
import createDocumentStore, { type DocumentStore } from './stores/document/document'
import createSelectionStore, { type SelectionStore } from './stores/document/selection'
import { type BlockNode, type BlockDataNode } from './document'
import createFormatStore, { type FormatStore } from './stores/document/format'
import createDragnDropStore, { type DragnDropStore } from './stores/document/dragndrop'
import { mergeData, type MergeDataAction, type MergeResult } from './merge'
import * as actions from './actions'
import type {
    SplitAction,
    MergeAction,
    CollapseAction,
    BreaklineAction,
    SwapAction,
    InsertAction,
    PromptAction,
    RemoveAction,
    ReplaceAction,
    ShadowAction,
    ShadowResult
} from './actions'
import { restoreSelectionSnapshot, type SelectionSnapshot } from './selection-snapshot'
import type { Readable } from 'svelte/store'
import {
    getDefaultApp,
    type SplitflowApp,
    type Dispatcher,
    type Result,
    type Gateway,
    type SplitflowAppKit
} from '@splitflow/app'
import {
    openFileDialog,
    uploadFile,
    type UploadAction,
    type UploadResult,
    type FileDialogAction
} from './file-upload'
import {
    createDesigner,
    createDesignerKit,
    type SplitflowDesigner,
    type SplitflowDesignerKit
} from '@splitflow/designer'
import gateway from './services/gateway'
import { storage } from './services/storage'
import { type Error, firstError } from '@splitflow/lib'
import * as extensions from './extensions'
import { createExtensionManager, type ExtensionMananger } from './extension'
import type { ShadowStore } from './stores/document/shadow'
import createShadowStore from './stores/document/shadow'
import {
    loadDocumentBundle,
    type DocumentBundle,
    type DocumentOptions,
    isDocumentBundle,
    type EditorBundle,
    isEditorBundle,
    isFulfilled
} from './loaders'

export interface FormatAction {
    type: 'format'
    tagName: 'B' | 'I'
    className: 'bold' | 'italic'
    off: boolean
}

export interface SelectOptions {
    atStart?: boolean
    afterUpdate?: boolean
    restoreAfterUpdate?: boolean
}

export interface SelectAction {
    type: 'select'
    block: BlockNode
    atStart: boolean
    afterUpdate: boolean
    restoreAfterUpdate: boolean
}

export interface SelectResult extends Result {
    snapshot?: SelectionSnapshot
}

export interface SnapshotSelectionOptions {
    collapsedAtStart?: boolean
    collapsedAtEnd?: boolean
    restoreAfterUpdate?: boolean
}

export interface SnapshotSelectionAction {
    type: 'snapshotselection'
    collapsedAtStart: boolean
    collapsedAtEnd: boolean
    restoreAfterUpdate: boolean
}

export interface SnapshotSelectionResult extends Result {
    snapshot?: SelectionSnapshot
}

export interface MergeDataOptions {
    fallback?: boolean
}

export interface FlushOptions {
    beforeSelection?: boolean
    afterSelection?: boolean
    change?: boolean
}

export interface FlushAction {
    type: 'flush'
    block: BlockNode
    beforeSelection: boolean
    afterSelection: boolean
    change: boolean
}

export interface FlushResult extends Result {
    block: BlockNode
}

export interface InsertOptions {
    before?: BlockNode
    after?: BlockNode
}

export interface ReplaceOptions {
    select?: boolean
}

export interface ShadowOptions {
    block?: BlockNode
    shadow?: BlockNode
    update?: BlockDataNode
    replace?: BlockNode
    flush?: boolean
    clear?: boolean
}

interface Stores {
    fragments: FragmentsStore
    shadow: ShadowStore
    document: DocumentStore
    selection: SelectionStore
    format: FormatStore
    dragndrop: DragnDropStore
}

interface Services {
    gateway?: () => void
    storage?: () => void
}

export interface EditorConfig {
    accountId?: string
    moduleName?: string
    moduleId?: string
    local?: boolean
    persistent?: boolean
}

export function createEditor(init: EditorConfig | EditorBundle, app?: SplitflowApp) {
    app ??= getDefaultApp()

    const bundle = isEditorBundle(init) ? init : undefined
    const config = isEditorBundle(init)
        ? init.config
        : { ...app.config, moduleName: 'Editor', ...init }

    const { dispatcher, gateway } = app
    const designer = createDesigner(
        bundle ?? { ...config, moduleType: 'editor', remote: true },
        undefined,
        undefined,
        app.designer
    )
    const extension = createExtensionManager()

    let fragments: FragmentsStore
    let shadow: ShadowStore
    const stores: Stores = {
        fragments: (fragments = createFragmentsStore()),
        shadow: (shadow = createShadowStore(fragments)),
        document: createDocumentStore(fragments, shadow),
        selection: createSelectionStore(),
        format: createFormatStore(),
        dragndrop: createDragnDropStore()
    }

    return new EditorModule(dispatcher, gateway, designer, extension, stores, config, bundle)
}

export const createModule = createEditor

export class EditorModule {
    constructor(
        dispatcher: Dispatcher,
        gateway: Gateway,
        designer: SplitflowDesigner,
        extension: ExtensionMananger,
        stores: Stores,
        config: EditorConfig,
        bundle: EditorBundle
    ) {
        this.dispatcher = dispatcher
        this.gateway = gateway
        this.designer = designer
        this.extension = extension
        this.stores = stores
        this.services = {}
        this.config = config
        this.bundle = bundle

        this.dispatcher.addActionHandler('collapse', actions.collapse, this)
        this.dispatcher.addActionHandler('merge', actions.merge, this)
        this.dispatcher.addActionHandler('breakline', actions.breakline, this)
        this.dispatcher.addActionHandler('split', actions.split, this)
        this.dispatcher.addActionHandler('swap', actions.swap, this)
        this.dispatcher.addActionHandler('insert', actions.insert, this)
        this.dispatcher.addActionHandler('remove', actions.remove, this)
        this.dispatcher.addActionHandler('replace', actions.replace, this)
        this.dispatcher.addActionHandler('shadow', actions.shadow, this)
        this.dispatcher.addActionHandler('prompt', actions.prompt, this)
        this.dispatcher.addActionHandler('mergedata', mergeData)
        this.dispatcher.addActionHandler('open', openFileDialog)
        this.dispatcher.addActionHandler('upload', uploadFile)

        this.extension.addExtension(extensions.highlight)
    }

    dispatcher: Dispatcher
    gateway: Gateway
    designer: SplitflowDesigner
    extension: ExtensionMananger
    stores: Stores
    services: Services
    config: EditorConfig
    bundle: EditorBundle
    #initialize: Promise<{ editor?: EditorModule; error?: Error }>

    async initialize(): Promise<{ editor?: EditorModule; error?: Error }> {
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
            this.services.gateway?.()
            this.services.storage?.()

            const { doc } = bundle.getDocResult
            this.stores.fragments.init(doc)
            this.stores.shadow.clear()

            if (!this.config.local && (this.config.persistent ?? true)) {
                this.services.gateway = gateway(this.gateway, this.stores.fragments, {
                    ...this.config,
                    ...bundle.options
                })
            } else if (this.config.local && (this.config.persistent ?? true)) {
                this.services.storage = storage(this.stores.fragments, bundle.options)
            }
        }

        return {}
    }

    destroy() {
        this.services.gateway?.()
        this.services.storage?.()

        this.dispatcher.removeActionHandler('collapse', actions.collapse, this)
        this.dispatcher.removeActionHandler('merge', actions.merge, this)
        this.dispatcher.removeActionHandler('breakline', actions.breakline, this)
        this.dispatcher.removeActionHandler('split', actions.split, this)
        this.dispatcher.removeActionHandler('swap', actions.swap, this)
        this.dispatcher.removeActionHandler('insert', actions.insert, this)
        this.dispatcher.removeActionHandler('remove', actions.remove, this)
        this.dispatcher.removeActionHandler('replace', actions.replace, this)
        this.dispatcher.removeActionHandler('shadow', actions.shadow, this)
        this.dispatcher.removeActionHandler('prompt', actions.prompt, this)
        this.dispatcher.removeActionHandler('mergedata', mergeData)
        this.dispatcher.removeActionHandler('open', openFileDialog)
        this.dispatcher.removeActionHandler('upload', uploadFile)
    }

    accept(editor: EditorModule) {
        return editor === this
    }

    plugin(plugin: (extension: ExtensionMananger) => void) {
        plugin(this.extension)
        return this
    }

    format(tagName: 'B' | 'I', off = false) {
        const action: FormatAction = {
            type: 'format',
            tagName,
            className: formatClassName(tagName),
            off
        }

        const snapshot = this.snapshotSelection()
        this.dispatcher.dispatchAction(action, { discriminator: this, multiDispatch: true })
        restoreSelectionSnapshot(snapshot)
    }

    select(block: BlockNode, options?: SelectOptions) {
        const action: SelectAction = {
            type: 'select',
            block,
            atStart: false,
            afterUpdate: false,
            restoreAfterUpdate: false,
            ...options
        }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    snapshotSelection(options?: SnapshotSelectionOptions) {
        const action: SnapshotSelectionAction = {
            type: 'snapshotselection',
            collapsedAtStart: false,
            collapsedAtEnd: false,
            restoreAfterUpdate: false,
            ...options
        }
        const result = this.dispatcher.dispatchAction(action, {
            discriminator: this
        }) as SnapshotSelectionResult
        return result?.snapshot
    }

    mergeData<T extends BlockNode>(block1: T, block2: BlockNode, options?: MergeDataOptions): T {
        const action: MergeDataAction = { type: 'mergedata', block1, block2, ...options }
        const result = this.dispatcher.dispatchAction(action, {
            discriminator: this
        }) as MergeResult
        return result.block as T
    }

    flush(block: BlockNode, options?: FlushOptions) {
        const action: FlushAction = {
            type: 'flush',
            block,
            beforeSelection: false,
            afterSelection: false,
            change: false,
            ...options
        }
        const result = this.dispatcher.dispatchAction(action, {
            discriminator: this
        }) as FlushResult
        return result.block
    }

    merge(block1: BlockNode, block2: BlockNode) {
        const action: MergeAction = { type: 'merge', block1, block2 }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    breakline(block: BlockNode) {
        const action: BreaklineAction = { type: 'breakline', block }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    split(block: BlockNode) {
        const action: SplitAction = { type: 'split', block }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    collapse(selection: BlockNode[]) {
        const action: CollapseAction = { type: 'collapse', selection }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    swap(selection: BlockNode[], swapBlock: BlockNode) {
        const action: SwapAction = { type: 'swap', selection, templateBlock: swapBlock }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    insert(block: BlockNode, options?: InsertOptions) {
        const action: InsertAction = { type: 'insert', block, ...options }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    remove(block: BlockNode) {
        const action: RemoveAction = { type: 'remove', block }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    replace(block1: BlockNode, block2: BlockNode, options?: ReplaceOptions) {
        const action: ReplaceAction = { type: 'replace', block1, block2, ...options }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    shadow(options?: ShadowOptions) {
        const action: ShadowAction = { type: 'shadow', ...options }
        const result = this.dispatcher.dispatchAction(action, { discriminator: this })
        return result as ShadowResult
    }

    openFileDialog(accept: string, close?: (file: File) => void) {
        const action: FileDialogAction = { type: 'open', name: 'filedialog', accept, close }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    upload(file: File) {
        const action: UploadAction = { type: 'upload', file }
        const result = this.dispatcher.dispatchAction(action, {
            discriminator: this
        }) as UploadResult
        return result.promise
    }

    prompt(placeholder: string, run: (value: string) => void) {
        const action: PromptAction = { type: 'prompt', placeholder, run }
        this.dispatcher.dispatchAction(action, { discriminator: this })
    }

    get document(): Readable<BlockNode[]> {
        return this.stores.document
    }
}

export function createEditorKit(config: EditorConfig, app: SplitflowAppKit) {
    config = { ...app.config, moduleName: 'Editor', ...config }

    const { gateway } = app
    const designer = createDesignerKit(
        { ...config, moduleType: 'editor', remote: true },
        undefined,
        app.designer
    )

    return {
        gateway,
        designer,
        config
    }
}

export interface EditorKit {
    gateway: Gateway
    designer: SplitflowDesignerKit
    config: EditorConfig
}

export function select(handler: (action: SelectAction) => SelectResult) {
    const editor = getContext<EditorModule>(EditorModule)
    let afterUpdateAction: SelectAction
    let afterUpdateSnapshot: SelectionSnapshot

    onMount(() => {
        function select(action: SelectAction): Result {
            if (action.afterUpdate) {
                afterUpdateAction = action
                return {}
            }

            if (action.restoreAfterUpdate) {
                const { snapshot } = handler(action)
                afterUpdateSnapshot = snapshot
                return {}
            }

            return handler(action)
        }

        editor.dispatcher.addActionHandler('select', select, editor)
        return () => editor.dispatcher.removeActionHandler('select', select, editor)
    })

    afterUpdate(() => {
        if (afterUpdateAction) {
            handler(afterUpdateAction)
            afterUpdateAction = null
        }
        if (afterUpdateSnapshot) {
            restoreSelectionSnapshot(afterUpdateSnapshot)
            afterUpdateSnapshot = null
        }
    })
}

export function snapshotSelection(
    handler: (action: SnapshotSelectionAction) => SnapshotSelectionResult
) {
    const editor = getContext<EditorModule>(EditorModule)
    let afterUpdateSnapshot: SelectionSnapshot

    onMount(() => {
        function snapshotSelection(action: SnapshotSelectionAction): Result {
            if (action.restoreAfterUpdate) {
                const { snapshot } = handler(action)
                afterUpdateSnapshot = snapshot
                return {}
            }

            return handler(action)
        }

        editor.dispatcher.addActionHandler('snapshotselection', snapshotSelection, editor)
        return () =>
            editor.dispatcher.removeActionHandler('snapshotselection', snapshotSelection, editor)
    })

    afterUpdate(() => {
        if (afterUpdateSnapshot) {
            restoreSelectionSnapshot(afterUpdateSnapshot)
            afterUpdateSnapshot = null
        }
    })
}

export function flush(handler: (action: FlushAction) => FlushResult) {
    const editor = getContext<EditorModule>(EditorModule)

    onMount(() => {
        editor.dispatcher.addActionHandler('flush', handler, editor)
        return () => editor.dispatcher.removeActionHandler('flush', handler, editor)
    })
}

function formatClassName(tagName: string) {
    switch (tagName) {
        case 'B':
            return 'bold'
        case 'I':
            return 'italic'
    }
}
