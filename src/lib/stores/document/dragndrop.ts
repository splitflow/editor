import { writable, type Readable } from 'svelte/store'
import { type BlockNode } from '../../document'

export interface DragnDropStore extends Readable<DragnDropState> {
    setDropTarget: (target: BlockNode) => void
    clear: () => void
}

export interface DragnDropState {
    target?: BlockNode
}

export default function createDragnDropStore(): DragnDropStore {
    const { subscribe, update, set } = writable<DragnDropState>({})

    function setDropTarget(target: BlockNode) {
        update((state) => ({ ...state, target }))
    }

    function clear() {
        set({})
    }

    return {
        subscribe,
        setDropTarget,
        clear
    }
}
