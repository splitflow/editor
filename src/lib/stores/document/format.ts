import { clean } from '@splitflow/core/utils'
import { writable, type Readable } from 'svelte/store'

export interface FormatStore extends Readable<FormatState> {
    push: (node: FormatState) => void
    clear: (key: string) => void
}

export interface FormatState {
    [key: string]: FormatData
}

export interface FormatData {
    B: boolean
    I: boolean
}

export default function createFormatStore(): FormatStore {
    let value: FormatState = {}

    const { subscribe, update } = writable(value)

    function push(nextState: FormatState) {
        update((state) => (value = { ...state, ...nextState }))
    }

    function clear(key: string) {
        if (value[key]) {
            update((state) => (value = clean({ ...state, [key]: undefined }) as FormatState))
        }
    }

    return { subscribe, push, clear }
}

export function readFormat(format: FormatState): FormatData {
    const result = {}

    for (const data of Object.values(format)) {
        for (const tagName of Object.keys(data)) {
            if (result[tagName] === undefined) {
                result[tagName] = data[tagName]
            } else {
                result[tagName] = result[tagName] && data[tagName]
            }
        }
    }
    return {
        B: false,
        I: false,
        ...result
    }
}

export function formatData(tagNames: string[]): FormatData {
    return {
        B: tagNames.includes('B'),
        I: tagNames.includes('I')
    }
}
