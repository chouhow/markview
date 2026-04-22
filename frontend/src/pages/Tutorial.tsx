import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import MarkdownRenderer from '../components/MarkdownRenderer'
import HighlightToolbar from '../components/HighlightToolbar'
import TurndownService from 'turndown'

// API base URL - uses relative path (proxied by nginx in production)
const API_BASE = ''

interface Chapter {
  id: string
  title: string
  file: string
}

interface ChapterListResponse {
  chapters: Chapter[]
  total: number
}

interface ChapterDetail {
  id: string
  title: string
  content: string
}

export default function Tutorial() {
  const { chapter } = useParams<{ chapter?: string }>()
  const navigate = useNavigate()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [chaptersLoading, setChaptersLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('') // 'saving' | 'saved' | 'error' | ''

  const activeChapter = chapter || '01'

  // Load chapters list from API
  useEffect(() => {
    fetch(`${API_BASE}/api/chapters`)
      .then(res => res.json())
      .then((data: ChapterListResponse) => {
        setChapters(data.chapters)
        setChaptersLoading(false)
      })
      .catch(err => {
        console.error('Failed to load chapters:', err)
        // Fallback: use hardcoded chapters if API fails
        setChapters([
          { id: '01', title: 'ES6概述与let/const', file: 'es6_chapter_01.md' },
          { id: '02', title: '箭头函数与函数增强', file: 'es6_chapter_02.md' },
          { id: '03', title: '模板字符串与解构赋值', file: 'es6_chapter_03.md' },
          { id: '04', title: '数组与对象的扩展', file: 'es6_chapter_04.md' },
          { id: '05', title: 'Promise与异步编程', file: 'es6_chapter_05.md' },
          { id: '06', title: 'Class类与模块化', file: 'es6_chapter_06.md' },
          { id: '07', title: '其他常用特性', file: 'es6_chapter_07.md' },
        ])
        setChaptersLoading(false)
      })
  }, [])

  // Load chapter content from API
  const loadChapter = useCallback(async (chapterId: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/chapters/${chapterId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data: ChapterDetail = await response.json()
      setContent(data.content)
    } catch {
      // Fallback: load from local file if API fails
      try {
        const ch = chapters.find(c => c.id === chapterId)
        if (ch) {
          const response = await fetch(`/${ch.file}`)
          let text = await response.text()
          text = text.replace(/\.\/images\//g, '/images/')
          setContent(text)
        } else {
          setError(`章节 ${chapterId} 不存在`)
        }
      } catch (err) {
        setError(`加载失败: ${err}`)
      }
    } finally {
      setLoading(false)
    }
  }, [chapters])

  useEffect(() => {
    if (!chaptersLoading) {
      loadChapter(activeChapter)
    }
  }, [activeChapter, chaptersLoading, loadChapter])

  const handleChapterChange = (id: string) => {
    navigate(`/${id}`)
    setMobileMenuOpen(false)
    window.scrollTo(0, 0)
  }

  // Turndown instance for HTML → Markdown conversion
  const turndownRef = useRef<TurndownService | null>(null)
  if (!turndownRef.current) {
    const td = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '_',
      strongDelimiter: '**',
    })
    // Custom rule: handle <pre><code> blocks from highlight.js
    td.addRule('fencedCodeBlock', {
      filter: (node) => {
        return node.nodeName === 'PRE' && node.querySelector('code') !== null
      },
      replacement: (_content, node) => {
        const codeNode = (node as HTMLElement).querySelector('code')
        if (!codeNode) return ''
        const className = codeNode.className || ''
        const langMatch = className.match(/language-(\w+)/)
        const lang = langMatch ? langMatch[1] : ''
        // Get raw text, not innerHTML
        const text = codeNode.textContent || ''
        return '\n\n```' + lang + '\n' + text + '\n```\n\n'
      }
    })
    // Custom rule: handle inline code
    td.addRule('inlineCode', {
      filter: (node) => {
        return node.nodeName === 'CODE' && !(node as HTMLElement).closest('pre')
      },
      replacement: (content) => {
        return '`' + content + '`'
      }
    })
    // Custom rule: skip deletable-block wrappers and JS badge divs
    td.addRule('skipEditUI', {
      filter: (node) => {
        return node.classList?.contains('delete-btn') ||
               node.classList?.contains('edit-notice') ||
               node.classList?.contains('empty-state') ||
               node.getAttribute?.('role') === 'presentation'
      },
      replacement: () => ''
    })
    turndownRef.current = td
  }

  // Save edited content to server
  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      const container = document.querySelector('.markdown-body') as HTMLElement
      if (!container) {
        setSaveStatus('error')
        return
      }

      // Clone to avoid modifying the rendered DOM
      const clone = container.cloneNode(true) as HTMLElement

      // Remove edit UI elements
      clone.querySelectorAll('.delete-btn, .edit-notice, .empty-state').forEach(el => el.remove())

      // Remove contenteditable attributes (keep edited content)
      clone.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable')
        el.removeAttribute('suppresscontenteditablewarning')
      })

      // Remove edit mode classes
      clone.querySelectorAll('.editable-paragraph, .inline-edit-target').forEach(el => {
        el.classList.remove('editable-paragraph', 'inline-edit-target')
      })

      // Remove deletable-block wrappers but keep their children
      clone.querySelectorAll('.deletable-block').forEach(el => {
        // Check if this block was "deleted" (all children removed by React)
        if (el.children.length <= 1) { // only delete-btn left
          el.remove()
          return
        }
        // Replace wrapper with its children (skip the delete button)
        const children = Array.from(el.childNodes).filter(
          (n) => !(n as HTMLElement).classList?.contains('delete-btn')
        )
        el.replaceWith(...children)
      })

      // Convert HTML → Markdown via turndown
      const turndown = turndownRef.current!
      let markdown = turndown.turndown(clone.innerHTML)

      // Post-process: clean up extra blank lines, fix image paths
      markdown = markdown
        .replace(/\n{3,}/g, '\n\n')    // 3+ blank lines → 2
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive spacing
        .replace(/!\[(.*?)]\(([^)]*)\)/g, (match, alt, src) => { // Fix image paths
          if (src.startsWith('/images/')) {
            return `![${alt}](${src.replace('/images/', './images/')})`
          }
          return match
        })
        .trim()

      // Send Markdown to backend
      const response = await fetch(`${API_BASE}/api/chapters/${activeChapter}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdown })
      })

      if (response.ok) {
        setContent(markdown)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        const errData = await response.json().catch(() => ({}))
        console.error('Save failed:', response.status, errData)
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Save error:', err)
      setSaveStatus('error')
    }
  }

  const currentChapter = chapters.find(c => c.id === activeChapter)
  const chapterIndex = chapters.findIndex(c => c.id === activeChapter)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          chapters={chapters}
          activeChapter={activeChapter}
          onSelect={handleChapterChange}
          onClose={() => setMobileMenuOpen(false)}
          editMode={editMode}
          onToggleEdit={() => setEditMode(!editMode)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
            {/* Chapter title bar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="打开菜单"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-md">
                    第 {chapterIndex + 1} 章
                  </span>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {currentChapter?.title || '加载中...'}
                  </h1>
                </div>
              </div>

              {/* Edit mode toggle */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${editMode
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }
                `}
                title={editMode ? '退出编辑模式' : '进入编辑模式'}
              >
                {editMode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    完成
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    编辑
                  </>
                )}
              </button>

              {/* Save button (only in edit mode) */}
              {editMode && (
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${saveStatus === 'saved'
                      ? 'bg-green-500 text-white'
                      : saveStatus === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      保存中...
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      已保存
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      失败
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      保存
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400"></div>
              </div>
            ) : (
              <MarkdownRenderer content={content} editMode={editMode} />
            )}
            {/* Floating highlight toolbar */}
            <HighlightToolbar enabled={editMode} />
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-12">
            <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>MarkView | Markdown 教程展示平台 | FastAPI + React</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

/* ===== Sidebar Component ===== */
interface SidebarProps {
  chapters: Chapter[]
  activeChapter: string
  onSelect: (id: string) => void
  onClose: () => void
  editMode: boolean
  onToggleEdit: () => void
}

function Sidebar({ chapters, activeChapter, onSelect, onClose, editMode, onToggleEdit }: SidebarProps) {
  const navigate = useNavigate()
  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              ES
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">MarkView</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{chapters.length} 章完整内容</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="关闭菜单"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Edit toggle */}
        <button
          onClick={onToggleEdit}
          className={`
            w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
            ${editMode
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          {editMode ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              编辑中 — 点击完成
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              启用编辑模式
            </>
          )}
        </button>
      </div>

      {/* Chapter list */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-2">
          章节目录
        </div>
        {chapters.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelect(ch.id)}
            className={`
              w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3
              ${activeChapter === ch.id
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-medium border border-yellow-200 dark:border-yellow-800'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
            `}
          >
            <span className={`
              w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0
              ${activeChapter === ch.id
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }
            `}>
              {ch.id}
            </span>
            <span className="truncate">{ch.title}</span>
          </button>
        ))}
      </nav>

      {/* Theme switcher link */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/themes')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all border border-purple-200 dark:border-purple-800"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          切换代码主题
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {editMode ? '编辑模式：悬停删除，选中文本高亮' : '选择章节开始学习'}
        </div>
      </div>
    </div>
  )
}
