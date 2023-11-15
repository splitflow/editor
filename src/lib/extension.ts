import type { Config, Style } from '@splitflow/designer'
import type { EditorModule } from './editor-module'
import { onMount } from 'svelte'
import { writable, type Readable } from 'svelte/store'

export interface Extension {
    type: string
    name: string
}

export interface ToolbarExtension {
    type: 'toolbar'
    toolbar?: ('main' | 'floating' | 'spacer')[]
    name: string
    svg: string
    activate: (editor: EditorModule) => {
        run: () => void
    }
}

export function toolbarExtension(toolbar: 'main' | 'floating' | 'spacer') {
    return {
        type: 'toolbar',
        match: (extension: ToolbarExtension) => {
            if (extension.toolbar?.includes(toolbar) ?? true) return extension
        }
    }
}

export interface BlockExtension {
    type: 'block'
    name: string
    blockType?: string[]
    activate: (
        editor: EditorModule,
        style: Style,
        config: Config
    ) => {
        element: HTMLElement
        keydown: (event: KeyboardEvent) => void
    }
}

export function blockExtension(blockType: string) {
    return {
        type: 'block',
        match: (extension: BlockExtension) => {
            if (extension.blockType?.includes(blockType) ?? true) return extension
        }
    }
}

export interface EditableExtension {
    type: 'editable'
    name: string
    blockType: string
    component: any
}

export interface ViewerExtension {
    type: 'viewer'
    name: string
    blockType: string
    component: any
}

interface ComponentExtension {
    type: string
    name: string
    activate?: (editor: EditorModule, style: Style, config: Config) => any
    component?: any
}

export function activateComponentExtensions<V extends ComponentExtension>(
    extensions: V[],
    { editor, style, config }: { editor: EditorModule; style: Style; config: Readable<Config> },
    activateOnMount = false
): Readable<{ extension: V; activation?: ReturnType<V['activate']> }[]> {
    let _mounted = false
    let _config: Config
    const activations = new Map<string, ReturnType<V['activate']>>()

    onMount(() => {
        _mounted = true
        if (activateOnMount && _config) {
            set(activate(_config))
        }
    })

    const { subscribe, set } = writable([], () => {
        const unsubscribe = config.subscribe(($config) => {
            _config = $config
            if (!activateOnMount || _mounted) {
                set(activate(_config))
            }
        })

        return () => unsubscribe()
    })

    function activate(config: Config) {
        const result = []
        for (const extension of extensions) {
            if (config[extension.name].enabled()) {
                if (extension.activate) {
                    let activation = activations.get(extension.name)
                    if (activation) {
                        activation.config = config
                    } else {
                        activation = extension.activate(editor, style, config)
                        activations.set(extension.name, activation)
                    }
                    result.push({ extension, activation })
                } else {
                    result.push({ extension })
                }
            } else {
                if (extension.activate) {
                    const activation = activations.get(extension.name)
                    activation?.destroy?.()
                }
            }
        }
        return result
    }

    return { subscribe }
}

export interface ExtensionMatcher<T> {
    type: string
    match?: (extension: Extension) => T
}

export interface ExtensionMananger {
    addExtension(extension: Extension): void
    removeExtension(extension: Extension): void
    get<T extends Extension>(type: string): T[]
    match<T extends Extension>(matcher: ExtensionMatcher<T>): T[]
}

export function createExtensionManager(): ExtensionMananger {
    const registry = new Map<string, Array<Extension>>()

    return {
        addExtension(extension: Extension) {
            let extensions = registry.get(extension.type)
            if (!extensions) {
                extensions = new Array()
                registry.set(extension.type, extensions)
            }
            if (extensions.findIndex((e) => e === extension) < 0) {
                extensions.push(extension)
            }
        },
        removeExtension(extension: Extension) {
            let extensions = registry.get(extension.type)
            if (extensions) {
                const index = extensions.findIndex((e) => e === extension)
                extensions.splice(index, 1)
            }
        },
        get(type: string) {
            const extensions = registry.get(type)
            return extensions ?? ([] as any)
        },
        match<T extends Extension>(matcher: ExtensionMatcher<T>) {
            const extensions = registry.get(matcher.type)
            if (extensions && matcher.match) return extensions.filter((e) => matcher.match(e))
            return extensions ?? ([] as any)
        }
    }
}
