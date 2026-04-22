import { useEffect, useState, useRef, useCallback } from 'react'

interface HighlightToolbarProps {
  enabled: boolean
}

// Check if a node has red color styling
function isRedSpan(el: Element | null): boolean {
  if (!el) return false
  const span = el.closest('span')
  if (!span) return false
  const color = span.style.color
  return color === 'rgb(239, 68, 68)' || color === '#ef4444' || color === 'red'
}

export default function HighlightToolbar({ enabled }: HighlightToolbarProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Check if selection is inside editable area
  const isInEditableArea = useCallback((node: Node | null): boolean => {
    if (!node) return false
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element
    if (!element) return false
    const target = element.closest('.inline-edit-target, [data-editable]')
    return !!target
  }, [])

  // Get current selection info
  const getSelectionInfo = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return null
    }
    const range = selection.getRangeAt(0)
    if (!isInEditableArea(range.commonAncestorContainer)) {
      return null
    }
    const parent = range.commonAncestorContainer
    const element = parent.nodeType === Node.TEXT_NODE ? parent.parentElement : parent as Element
    return { range, element, selection }
  }, [isInEditableArea])

  // Update toolbar position
  const updatePosition = useCallback(() => {
    const info = getSelectionInfo()
    if (!info) {
      setVisible(false)
      return
    }
    setVisible(true)

    const { range } = info
    const rect = range.getBoundingClientRect()
    const toolbarWidth = 200
    let left = rect.left + rect.width / 2 - toolbarWidth / 2
    let top = rect.top - 52

    if (left < 8) left = 8
    if (left + toolbarWidth > window.innerWidth - 8) {
      left = window.innerWidth - toolbarWidth - 8
    }
    if (top < 8) top = rect.bottom + 10

    setPosition({ top, left })
  }, [getSelectionInfo])

  // Listen for selection changes
  useEffect(() => {
    if (!enabled) {
      setVisible(false)
      return
    }
    const handleSelectionChange = () => {
      setTimeout(updatePosition, 50)
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [enabled, updatePosition])

  // Hide toolbar on click outside
  useEffect(() => {
    if (!enabled || !visible) return
    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        const target = e.target as Element
        if (!target.closest('.highlight-toolbar')) {
          setVisible(false)
        }
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [enabled, visible])

  // ===== Apply yellow highlight =====
  const applyHighlight = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const parent = range.commonAncestorContainer
    const element = parent.nodeType === Node.TEXT_NODE ? parent.parentElement : parent as Element
    const existingMark = element?.closest('mark')

    if (existingMark) {
      // Remove highlight
      const p = existingMark.parentNode
      if (p) {
        while (existingMark.firstChild) p.insertBefore(existingMark.firstChild, existingMark)
        p.removeChild(existingMark)
      }
    } else {
      wrapWithTag(range, 'mark', (el) => {
        el.style.background = 'linear-gradient(120deg, #fef08a 0%, #fde047 100%)'
        el.style.padding = '1px 3px'
        el.style.borderRadius = '3px'
      })
    }
    sel.removeAllRanges()
    setVisible(false)
  }, [])

  // ===== Apply red text =====
  const applyRed = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const parent = range.commonAncestorContainer
    const element = parent.nodeType === Node.TEXT_NODE ? parent.parentElement : parent as Element

    if (isRedSpan(element)) {
      // Remove red - unwrap the span
      const span = element!.closest('span')!
      const p = span.parentNode
      if (p) {
        while (span.firstChild) p.insertBefore(span.firstChild, span)
        p.removeChild(span)
      }
    } else {
      wrapWithTag(range, 'span', (el) => {
        el.style.color = '#ef4444'
        el.style.fontWeight = '600'
      })
    }
    sel.removeAllRanges()
    setVisible(false)
  }, [])

  // Check current modes
  const sel = window.getSelection()
  let inMark = false
  let inRed = false
  if (sel && sel.rangeCount > 0) {
    const parent = sel.getRangeAt(0).commonAncestorContainer
    const element = parent.nodeType === Node.TEXT_NODE ? parent.parentElement : parent as Element
    inMark = !!element?.closest('mark')
    inRed = isRedSpan(element)
  }

  if (!enabled || !visible) return null

  return (
    <div
      ref={toolbarRef}
      className="highlight-toolbar fixed z-[100] animate-toolbar-pop"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-0.5 bg-gray-900 dark:bg-gray-800 rounded-xl shadow-2xl px-2 py-1.5 border border-gray-700">

        {/* Highlight button */}
        <button
          onClick={applyHighlight}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            inMark ? 'text-yellow-400 bg-gray-700' : 'text-white hover:bg-gray-700'
          }`}
          title={inMark ? '取消高亮' : '添加高亮'}
        >
          {inMark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <span className="inline-block w-4 h-4 rounded bg-gradient-to-r from-yellow-300 to-yellow-400 border border-yellow-500" />
          )}
          {inMark ? '取消' : '高亮'}
        </button>

        {/* Red text button */}
        <button
          onClick={applyRed}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            inRed ? 'text-red-400 bg-gray-700' : 'text-white hover:bg-gray-700'
          }`}
          title={inRed ? '取消标红' : '文字标红'}
        >
          {inRed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <span className="text-red-500 font-bold text-base">A</span>
          )}
          {inRed ? '取消' : '标红'}
        </button>

        <div className="w-px h-5 bg-gray-600 mx-1" />

        {/* Bold */}
        <button
          onClick={() => wrapSelection('strong')}
          className="px-2 py-1.5 rounded-lg text-white hover:bg-gray-700 transition-all font-bold text-sm"
          title="加粗"
        >
          B
        </button>

        {/* Italic */}
        <button
          onClick={() => wrapSelection('em')}
          className="px-2 py-1.5 rounded-lg text-white hover:bg-gray-700 transition-all italic text-sm"
          title="斜体"
        >
          I
        </button>

        <div className="w-px h-5 bg-gray-600 mx-1" />

        {/* Close */}
        <button
          onClick={() => setVisible(false)}
          className="px-2 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
          title="关闭"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-800" />
      </div>
    </div>
  )
}

// ===== Helper: wrap selection in a tag with optional style callback =====
function wrapWithTag(range: Range, tagName: string, styleFn?: (el: HTMLElement) => void) {
  const el = document.createElement(tagName)
  if (styleFn) styleFn(el)
  try {
    range.surroundContents(el)
  } catch {
    const contents = range.extractContents()
    el.appendChild(contents)
    range.insertNode(el)
  }
}

// ===== Helper: wrap selection in a simple tag =====
function wrapSelection(tagName: string) {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return
  wrapWithTag(selection.getRangeAt(0), tagName)
  selection.removeAllRanges()
}
