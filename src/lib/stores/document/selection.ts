import { writable, type Readable } from 'svelte/store'
import { key, type BlockNode, parseKey } from '../../document'
import { isEmpty, last as _last } from '@splitflow/core/utils'

export interface SelectionStore extends Readable<SelectionState> {
    push: (state: SelectionState) => void
    clear: () => void
    read: () => BlockNode[]
    selectionBuilder: () => SelectionBuilder
}

interface SelectionBuilder {
    select: (block: BlockNode) => boolean
    unselect: (block: BlockNode) => boolean
    flush: () => void
}

export interface SelectionState {
    [key: string]: true
}

export default function createSelectionStore(): SelectionStore {
    let value: SelectionState = {}

    const { subscribe, set, update } = writable(value)

    function push(nextState: SelectionState) {
        update((state) => (value = { ...state, ...nextState }))
    }

    function clear() {
        if (!isEmpty(value)) {
            set((value = {}))
        }
    }

    function read() {
        return readSelection(value)
    }

    function selectionBuilder() {
        const state = { ...value }
        const buffer: SelectionState = {}

        function select(block: BlockNode) {
            const blockKey = key(block)
            buffer[blockKey] = true
            return !state[blockKey]
        }

        function unselect(block: BlockNode) {
            return state[key(block)] ?? false
        }

        function flush() {
            set((value = buffer))
        }

        return { select, unselect, flush }
    }

    return {
        subscribe,
        push,
        clear,
        read,
        selectionBuilder
    }
}

export function readSelection(state: SelectionState) {
    return Object.keys(state).map(parseKey)
}

export interface BlockTypeData {
    [key: string]: true
}

export function readBlockType(state: SelectionState): BlockTypeData {
    const result = {}

    for (const [key, selected] of Object.entries(state)) {
        if (selected) {
            const { blockType } = parseKey(key)
            result[blockType] = true

            if (Object.keys(result).length > 1) return {}
        }
    }

    return result
}

export function createUnselect() {
    let _selected = false

    return (state: SelectionState, block: BlockNode, run: () => void) => {
        const selected = state[key(block)] ?? false
        if (selected === false && _selected === true) {
            run()
        }
        _selected = selected
    }
}

export function isSelected(state: SelectionState, block: BlockNode) {
    return state[key(block)] ?? false
}