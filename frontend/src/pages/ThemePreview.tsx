import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import hljs from 'highlight.js'

const themes = [
  { id: 'github-dark', name: 'GitHub Dark', desc: '经典暗色，简洁清晰', color: '#0d1117' },
  { id: 'atom-one-dark', name: 'Atom One Dark', desc: 'VS Code 风格，现代感', color: '#282c34' },
  { id: 'monokai', name: 'Monokai', desc: 'Sublime Text 经典', color: '#272822' },
  { id: 'dracula', name: 'Dracula', desc: '紫黑底，开发者最爱', color: '#282a36' },
  { id: 'nord', name: 'Nord', desc: '北欧蓝灰，护眼柔和', color: '#2e3440' },
  { id: 'tokyo-night-dark', name: 'Tokyo Night', desc: '日系深蓝，现代炫酷', color: '#1a1b26' },
  { id: 'vs2015', name: 'VS2015', desc: '微软深蓝，经典稳重', color: '#1e1e1e' },
  { id: 'stackoverflow-dark', name: 'StackOverflow', desc: '问答社区风格', color: '#1c1b22' },
]

const demoCode = `// JavaScript Promise 示例
const fetchUser = (id) => {
  return new Promise((resolve, reject) => {
    const success = true;
    const user = { id, name: '张三', age: 25 };

    if (success) {
      resolve(user);  // 成功
    } else {
      reject(new Error('获取失败'));  // 失败
    }
  });
};

// async/await 语法糖
async function main() {
  try {
    const user = await fetchUser(42);
    console.log(\`用户信息: \${user.name}\`);
    return user;
  } catch (err) {
    console.error('错误:', err.message);
  }
}

// 箭头函数 + 解构
const users = [{ name: 'Alice', score: 95 }, { name: 'Bob', score: 87 }];
const topUsers = users
  .filter(({ score }) => score >= 90)
  .map(({ name, score }) => ({ name, grade: 'A' }));

/* 多行注释
   模板字符串、默认参数 */
function greet(name = '游客', greeting = \`你好, \${name}!\`) {
  return greeting;
}

console.log(greet());         // 你好, 游客!
console.log(greet('李四'));    // 你好, 李四!
`

export default function ThemePreview() {
  const [activeTheme, setActiveTheme] = useState('dracula')
  const navigate = useNavigate()
  const codeRef = useRef<HTMLElement>(null)
  const linkRef = useRef<HTMLLinkElement | null>(null)

  // Dynamic load theme CSS
  useEffect(() => {
    // Remove old link if exists
    if (linkRef.current) {
      document.head.removeChild(linkRef.current)
    }

    // Create new link
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${activeTheme}.min.css`
    document.head.appendChild(link)
    linkRef.current = link

    // Highlight code
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }

    return () => {
      if (linkRef.current && document.head.contains(linkRef.current)) {
        document.head.removeChild(linkRef.current)
      }
    }
  }, [activeTheme])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="返回教程"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">代码高亮主题预览</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">点击卡片切换主题，找到你喜欢的风格</p>
            </div>
          </div>

          {/* Current theme badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">当前主题:</span>
            <span
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: themes.find(t => t.id === activeTheme)?.color }}
            >
              {themes.find(t => t.id === activeTheme)?.name}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Theme cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.id)}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${activeTheme === theme.id
                  ? 'border-yellow-400 shadow-lg ring-2 ring-yellow-400/20 scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                }
              `}
              style={{ backgroundColor: theme.color + '20' }}
            >
              {/* Color dot */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-600 shadow"
                  style={{ backgroundColor: theme.color }}
                />
                <span className={`text-sm font-semibold ${activeTheme === theme.id ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {theme.name}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{theme.desc}</p>
              {activeTheme === theme.id && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Code preview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {/* Code header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="ml-3 text-xs text-gray-500 dark:text-gray-400 font-mono">example.js</span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">JavaScript</span>
          </div>

          {/* Code content */}
          <div className="overflow-x-auto p-0">
            <pre className="m-0 rounded-none" style={{ background: 'transparent' }}>
              <code
                ref={codeRef}
                className="hljs language-javascript block text-sm leading-relaxed p-6"
              >
                {demoCode}
              </code>
            </pre>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-pink-500" /> 关键字</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> 字符串</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" /> 函数</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> 数字</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400" /> 注释</span>
        </div>

        {/* Apply button */}
        <div className="mt-8 text-center pb-8">
          <button
            onClick={() => {
              // Save to localStorage and redirect
              localStorage.setItem('markview-code-theme', activeTheme)
              navigate('/')
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            使用「{themes.find(t => t.id === activeTheme)?.name}」主题
          </button>
          <p className="mt-2 text-xs text-gray-400">点击后返回教程页面，代码块将应用此主题</p>
        </div>
      </div>
    </div>
  )
}
