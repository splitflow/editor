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

export function toolbarExtensions(extensions: Extension[]) {
    return extensions as ToolbarExtension[]
}

export function activateExtension<U, V>(extension: { activate: (context: U) => V }, context: U) {
    const body = extension.activate(context)
    return body
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
    activateOnMount?: boolean
): Readable<{ extension: V; activation?: ReturnType<V['activate']> }[]> {
    const activations = new Map<string, ReturnType<V['activate']>>()

    const { subscribe } = writable([], (set) => {
        const unsubscribe = config.subscribe(($config) => {
            const result = []

            for (const extension of extensions) {
                if ($config[extension.name].enabled()) {
                    if (extension.activate) {
                        let activation = activations.get(extension.name)
                        if (activation) {
                            activation.config = $config
                        } else {
                            activation = extension.activate(editor, style, $config)
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

            set(result)
        })

        return () => unsubscribe()
    })

    return { subscribe }
}

export function activateComponentExtensions2<U, V>(
    extensions: { activate: (context: U) => V }[],
    context: U,
    activateOnMount?: boolean
): V[] {
    let bodies: V[]

    if (activateOnMount) {
        onMount(() => {
            bodies = extensions.map((e) => e.activate(context))
        })
    } else {
        bodies = extensions.map((e) => e.activate(context))
    }

    if (activateOnMount) {
        return {
            *[Symbol.iterator]() {
                for (const body of bodies) yield body
            },
            forEach(callbackFn: (value: V, index: number, array: V[]) => void) {
                for (const [index, body] of bodies.entries()) callbackFn(body, index, bodies)
            }
        } as V[]
    }
    return bodies
}

export function activateExtensions<T>(
    extensions: { activate: (editor: EditorModule) => T }[],
    editor: EditorModule
) {
    const bodies: T[] = []

    for (const extension of extensions) {
        bodies.push(extension.activate(editor))
    }
    return bodies
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
