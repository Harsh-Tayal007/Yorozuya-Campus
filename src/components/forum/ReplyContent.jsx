// src/components/forum/ReplyContent.jsx
const ALLOWED_TAGS = new Set([
  "p","br","strong","em","s","del","u",
  "h1","h2","h3","h4","h5","h6",
  "ul","ol","li",
  "blockquote","pre","code",
  "a","hr",
])

function isHtml(str) {
  return /<[a-z][\s\S]*>/i.test(str)
}

export default function ReplyContent({ content, className = "" }) {
  if (!content) return null

  if (!isHtml(content)) {
    return (
      <p className={`text-sm leading-relaxed text-foreground/90 break-words whitespace-pre-wrap overflow-hidden ${className}`}>
        {content}
      </p>
    )
  }

  return (
    <>
      <style>{`
        .reply-html         { overflow-wrap: anywhere; word-break: break-word; overflow: hidden; min-width: 0; }
        .reply-html p        { margin: 0.15em 0; font-size: 14px; line-height: 1.6; color: var(--foreground); opacity: 0.9; }
        .reply-html h1       { font-size: 1.25em; font-weight: 700; margin: 0.5em 0 0.25em; }
        .reply-html h2       { font-size: 1.1em;  font-weight: 700; margin: 0.5em 0 0.25em; }
        .reply-html h3       { font-size: 1em;    font-weight: 600; margin: 0.4em 0 0.2em; }
        .reply-html strong   { font-weight: 700; }
        .reply-html em       { font-style: italic; }
        .reply-html s,
        .reply-html del      { text-decoration: line-through; opacity: 0.7; }
        .reply-html code     {
          font-family: monospace; font-size: 0.82em;
          background: rgba(255,255,255,0.08); border-radius: 4px;
          padding: 1px 5px; border: 1px solid rgba(255,255,255,0.1);
          color: #3b82f6;
        }
        .reply-html pre      {
          background: rgba(255,255,255,0.05); border-radius: 8px;
          padding: 10px 14px; margin: 6px 0; overflow-x: auto;
          border: 1px solid rgba(255,255,255,0.08);
          max-width: 100%;
        }
        .reply-html pre code { background: none; border: none; padding: 0; color: var(--foreground); }
        .reply-html blockquote {
          border-left: 2px solid rgba(59,130,246,0.5);
          padding-left: 12px; margin: 4px 0;
          color: var(--muted-foreground); font-style: italic;
        }
        .reply-html ul       { list-style: disc;    padding-left: 20px; margin: 4px 0; }
        .reply-html ol       { list-style: decimal; padding-left: 20px; margin: 4px 0; }
        .reply-html li       { margin: 2px 0; font-size: 14px; }
        .reply-html a        { color: #3b82f6; text-decoration: underline; text-underline-offset: 2px; word-break: break-all; }
        .reply-html a:hover  { opacity: 0.8; }
        .reply-html img      { max-width: 100%; height: auto; }
      `}</style>
      <div
        className={`reply-html break-words min-w-0 overflow-hidden ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  )
}