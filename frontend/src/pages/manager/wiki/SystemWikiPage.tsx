import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

type WikiBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; alt: string; src: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'code'; language: string; text: string }

const wikiPath = '/docs/system-wiki.md'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index))
    }

    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>)
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        nodes.push(
          <a key={`${match.index}-link`} href={linkMatch[2]} target={linkMatch[2].startsWith('#') ? undefined : '_blank'} rel="noreferrer">
            {linkMatch[1]}
          </a>
        )
      }
    }

    cursor = match.index + token.length
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes
}

function parseWiki(markdown: string): WikiBlock[] {
  const blocks: WikiBlock[] = []
  const lines = markdown.split(/\r?\n/)
  let paragraph: string[] = []
  let list: string[] = []
  let table: string[][] = []
  let code: string[] = []
  let codeLanguage = ''

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }

  const flushList = () => {
    if (!list.length) return
    blocks.push({ type: 'list', items: list })
    list = []
  }

  const flushTable = () => {
    if (!table.length) return
    blocks.push({ type: 'table', rows: table })
    table = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (code.length || line.startsWith('```')) {
      if (line.startsWith('```') && !code.length) {
        flushParagraph()
        flushList()
        flushTable()
        codeLanguage = line.slice(3).trim()
        code = ['']
        continue
      }

      if (line.startsWith('```')) {
        blocks.push({ type: 'code', language: codeLanguage, text: code.slice(1).join('\n') })
        code = []
        codeLanguage = ''
        continue
      }

      code.push(rawLine)
      continue
    }

    if (!line) {
      flushParagraph()
      flushList()
      flushTable()
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      flushTable()
      const text = headingMatch[2]
      blocks.push({ type: 'heading', level: headingMatch[1].length as 1 | 2 | 3, text, id: slugify(text) })
      continue
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      flushParagraph()
      flushList()
      flushTable()
      blocks.push({ type: 'image', alt: imageMatch[1], src: `/docs/${imageMatch[2]}` })
      continue
    }

    if (line.startsWith('|') && line.endsWith('|') && !line.includes('---')) {
      flushParagraph()
      flushList()
      table.push(line.split('|').slice(1, -1).map((cell) => cell.trim()))
      continue
    }

    if (line.startsWith('- ')) {
      flushParagraph()
      flushTable()
      list.push(line.slice(2))
      continue
    }

    flushList()
    flushTable()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  flushTable()

  return blocks
}

export function SystemWikiPage() {
  const location = useLocation()
  const [markdown, setMarkdown] = useState('')
  const [error, setError] = useState<string | null>(null)
  const blocks = useMemo(() => parseWiki(markdown), [markdown])
  const headings = blocks.filter((block): block is Extract<WikiBlock, { type: 'heading' }> => block.type === 'heading' && block.level === 2)

  useEffect(() => {
    let cancelled = false

    fetch(wikiPath)
      .then((response) => {
        if (!response.ok) throw new Error('Wiki not found')
        return response.text()
      })
      .then((content) => {
        if (!cancelled) {
          setMarkdown(content)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load the system wiki.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!blocks.length || !location.hash) return
    const target = document.getElementById(location.hash.slice(1))
    if (typeof target?.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'start' })
    }
  }, [blocks.length, location.hash])

  return (
    <section className="system-wiki-page">
      <header className="card stack system-wiki-hero">
        <div>
          <p className="eyebrow">Client documentation</p>
          <h2>System Wiki</h2>
          <p className="muted">Operational guide for job tickets, employee work, Manager/Admin workflows, reporting, master data, and training.</p>
        </div>
        <div className="row system-wiki-actions">
          <a className="button-link secondary-link" href={wikiPath} target="_blank" rel="noreferrer">Open markdown</a>
          <button className="secondary-button" type="button" onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {!markdown && !error ? <p className="muted" role="status">Loading system wiki...</p> : null}

      {markdown ? (
        <div className="system-wiki-layout">
          <aside className="card system-wiki-toc" aria-label="Wiki table of contents">
            <h3>Contents</h3>
            {headings.map((heading) => (
              <a key={heading.id} href={`#${heading.id}`}>{heading.text}</a>
            ))}
          </aside>
          <article className="card system-wiki-document">
            {blocks.map((block, index) => {
              if (block.type === 'heading') {
                const Heading = `h${block.level}` as 'h1' | 'h2' | 'h3'
                return <Heading id={block.id} key={`${block.id}-${index}`}>{block.text}</Heading>
              }

              if (block.type === 'paragraph') {
                return <p key={index}>{formatInline(block.text)}</p>
              }

              if (block.type === 'list') {
                return <ul key={index}>{block.items.map((item) => <li key={item}>{formatInline(item)}</li>)}</ul>
              }

      if (block.type === 'image') {
        return <img alt={block.alt} className="system-wiki-image" key={index} src={block.src} />
      }

              if (block.type === 'code') {
                return (
                  <pre className="system-wiki-code" key={index}>
                    {block.language ? <span>{block.language}</span> : null}
                    <code>{block.text}</code>
                  </pre>
                )
              }

              return (
                <div className="table-scroll" key={index}>
                  <table>
                    <tbody>
                      {block.rows.map((row, rowIndex) => (
                        <tr key={`${row.join('-')}-${rowIndex}`}>
                          {row.map((cell) => rowIndex === 0
                            ? <th key={cell}>{formatInline(cell)}</th>
                            : <td key={cell}>{formatInline(cell)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </article>
        </div>
      ) : null}

      <p className="muted">
        <Link to="/manage">Back to Manager/Admin dashboard</Link>
      </p>
    </section>
  )
}
