import type { Config, Style } from '@splitflow/designer'
import { getNodeRange, matchRangeBackward, wrapRange } from '../dom'
import type { EditorModule } from '../editor-module'
import { restoreSelectionSnapshot } from '../selection-snapshot'
import { type BlockExtension } from '../extension'

const LINK_REGEXP =
    /(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu
const EMAIL_REGEXP =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i

export function activate(editor: EditorModule, style: Style, config: Config) {
    let highlightLink = config.highlight.link(true)
    let highlightMailto = config.highlight.mailto(true)
    let element: HTMLElement

    return {
        set element(_element: HTMLElement) {
            element = _element
        },
        set config(config: Config) {
            highlightLink = config.highlight.link(true)
            highlightMailto = config.highlight.mailto(true)
        },
        keydown(event: KeyboardEvent) {
            if (event.key === ' ') {
                const range = getNodeRange(element, { beforeSelection: true })

                let highlightRange: Range
                let highlightWrapper: HTMLElement

                if (highlightLink) {
                    highlightRange = matchRangeBackward(range, LINK_REGEXP)

                    if (highlightRange) {
                        highlightWrapper = document.createElement('a')
                        highlightWrapper.setAttribute('class', style.link())
                        highlightWrapper.setAttribute('href', highlightRange.toString())
                        highlightWrapper.setAttribute('target', '_blank')
                    }
                }

                if (!highlightWrapper && highlightMailto) {
                    highlightRange = matchRangeBackward(range, EMAIL_REGEXP)

                    if (highlightRange) {
                        highlightWrapper = document.createElement('a')
                        highlightWrapper.setAttribute('class', style.link())
                        highlightWrapper.setAttribute('href', `mailto:${highlightRange.toString()}`)
                        highlightWrapper.setAttribute('target', '_blank')
                    }
                }

                if (highlightWrapper) {
                    const snapshot = editor.snapshotSelection()
                    wrapRange(highlightRange, element, highlightWrapper)
                    restoreSelectionSnapshot(snapshot)
                }
            }
        }
    }
}

const highlight: BlockExtension = {
    type: 'block',
    name: 'highlight',
    blockType: ['paragraph'],
    activate
}
export default highlight
