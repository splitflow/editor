import { afterUpdate, getContext, onMount } from 'svelte'
import { restoreSelectionSnapshot, type SelectionSnapshot } from './selection-snapshot'
import {
	EditorModule,
	type SelectAction,
	type SelectResult,
	type SnapshotSelectionAction,
	type SnapshotSelectionResult
} from './editor-module'
import type { Result } from '@splitflow/app'

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
