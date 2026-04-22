import { useState, useCallback, useRef, createContext, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import hljs from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'

hljs.registerLanguage('javascript', javascript)

interface MarkdownRendererProps {
  content: string
  editMode: boolean
}

// Context to track if we're inside a wrapped container
const ContainerContext = createContext(false)

export default function MarkdownRenderer({ content, editMode }: MarkdownRendererProps) {
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set())
  const counterRef = useRef(0)

  counterRef.current = 0

  const getNextId = useCallback(() => {
    counterRef.current += 1
    return counterRef.current
  }, [])

  const handleDelete = useCallback((id: number) => {
    setDeletedIds(prev => new Set([...prev, id]))
  }, [])

  const allDeleted = counterRef.current > 0 && deletedIds.size >= counterRef.current

  // Delete button
  const DeleteBtn = ({ id }: { id: number }) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        handleDelete(id)
      }}
      className="delete-btn"
      title="删除此元素"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )

  // Wrapper - only wraps when NOT inside a container
  const Wrapper = ({ id, children, className = '' }: {
    id: number
    children: React.ReactNode
    className?: string
  }) => {
    if (deletedIds.has(id)) return null
    if (!editMode) return <div className={className}>{children}</div>
    return (
      <div className={`deletable-block ${className}`}>
        <DeleteBtn id={id} />
        {children}
      </div>
    )
  }

  // Dynamic load code highlight theme
  useEffect(() => {
    const theme = localStorage.getItem('markview-code-theme') || 'github-dark'
    const existing = document.getElementById('hljs-theme') as HTMLLinkElement
    if (existing) {
      existing.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${theme}.min.css`
    } else {
      const link = document.createElement('link')
      link.id = 'hljs-theme'
      link.rel = 'stylesheet'
      link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${theme}.min.css`
      document.head.appendChild(link)
    }
    hljs.highlightAll()
  }, [content])

  // Editable text component
  const EditableText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    if (!editMode) return <>{children}</>
    return (
      <span
        className={`inline-edit-target ${className}`}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => console.log('Edited:', e.currentTarget.textContent)}
      >
        {children}
      </span>
    )
  }

  return (
    <div>
      {editMode && (
        <div className="edit-notice">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>编辑模式 — 悬停内容显示删除按钮；点击文本可直接编辑（刷新恢复）</span>
        </div>
      )}

      {allDeleted && (
        <div className="empty-state">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">内容已清空</p>
          <p className="text-gray-400 text-sm mt-1">刷新页面即可恢复原始内容</p>
        </div>
      )}

      <article className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // ===== Headings =====
            h1: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white pb-3 border-b-2 border-yellow-400">
                    {editMode ? <EditableText>{children}</EditableText> : children}
                  </h1>
                </Wrapper>
              )
            },

            h2: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-10 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-yellow-400 rounded-full shrink-0"></span>
                    {editMode ? <EditableText>{children}</EditableText> : children}
                  </h2>
                </Wrapper>
              )
            },

            h3: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-8 mb-3">
                    {editMode ? <EditableText>{children}</EditableText> : children}
                  </h3>
                </Wrapper>
              )
            },

            // ===== Paragraph =====
            p: ({ children }) => {
              return (
                <ContainerContext.Consumer>
                  {inContainer => {
                    if (inContainer) {
                      // Inside blockquote/details - just render, no delete button
                      return (
                        <p className={`text-gray-700 dark:text-gray-300 leading-relaxed my-2 ${editMode ? 'inline-edit-target' : ''}`}
                           contentEditable={editMode || undefined}
                           suppressContentEditableWarning
                        >
                          {children}
                        </p>
                      )
                    }
                    // Standalone paragraph - wrap with delete
                    const id = getNextId()
                    return (
                      <Wrapper id={id} className="my-1">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed my-4">
                          {editMode ? <EditableText>{children}</EditableText> : children}
                        </p>
                      </Wrapper>
                    )
                  }}
                </ContainerContext.Consumer>
              )
            },

            // ===== Blockquote (container) =====
            blockquote: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <blockquote className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 pl-4 py-3 pr-4 rounded-r-lg my-4 text-gray-700 dark:text-gray-300">
                    <ContainerContext.Provider value={true}>
                      {children}
                    </ContainerContext.Provider>
                  </blockquote>
                </Wrapper>
              )
            },

            // ===== Code block =====
            pre: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <div className="relative my-6">
                    <div className="absolute top-0 right-0 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-bl-lg rounded-tr-lg border-b border-l border-gray-200 dark:border-gray-700 z-10">
                      JS
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-5 pt-8 rounded-xl overflow-x-auto text-sm leading-relaxed shadow-lg">
                      {children}
                    </pre>
                  </div>
                </Wrapper>
              )
            },

            // Inline code
            code: ({ className, children }) => {
              const match = /language-(\w+)/.exec(className || '')
              const isInline = !match && !className?.includes('hljs')
              if (isInline) {
                return (
                  <code className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                )
              }
              return <code className={className}>{children}</code>
            },

            // ===== Table =====
            table: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <table className="w-full text-sm">{children}</table>
                  </div>
                </Wrapper>
              )
            },

            thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>,

            th: ({ children }) => (
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                {children}
              </th>
            ),

            td: ({ children }) => (
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                {children}
              </td>
            ),

            tr: ({ children }) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">{children}</tr>,

            // ===== Lists =====
            ul: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <ul className="list-disc list-inside space-y-2 my-4 text-gray-700 dark:text-gray-300">
                    {children}
                  </ul>
                </Wrapper>
              )
            },

            ol: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <ol className="list-decimal list-inside space-y-2 my-4 text-gray-700 dark:text-gray-300">
                    {children}
                  </ol>
                </Wrapper>
              )
            },

            li: ({ children }) => <li className="leading-relaxed">{children}</li>,

            // ===== HR =====
            hr: () => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <hr className="my-8 border-gray-200 dark:border-gray-700" />
                </Wrapper>
              )
            },

            // ===== Image =====
            img: ({ src, alt }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <div className="my-8">
                    <img src={src || ''} alt={alt || ''} className="w-full rounded-xl shadow-lg border border-gray-200 dark:border-gray-700" />
                    {alt && <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">{alt}</p>}
                  </div>
                </Wrapper>
              )
            },

            // ===== Strong =====
            strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,

            // ===== Details (container) =====
            details: ({ children }) => {
              const id = getNextId()
              return (
                <Wrapper id={id} className="my-2">
                  <details className="my-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer">
                    <ContainerContext.Provider value={true}>
                      {children}
                    </ContainerContext.Provider>
                  </details>
                </Wrapper>
              )
            },

            summary: ({ children }) => (
              <summary className="font-semibold text-blue-700 dark:text-blue-400 list-none flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {children}
              </summary>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  )
}
