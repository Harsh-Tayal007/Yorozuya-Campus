// src/components/forum/TiptapEditor.jsx
import { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { createPortal } from "react-dom"
import {
  Bold, Italic, Strikethrough,
  Heading1, Heading2, Heading3,
  Code, List, ListOrdered, Quote, Link as LinkIcon, X,
  Undo, Redo,
} from "lucide-react"

/* ─── Link Modal ─────────────────────────────────────────────── */
function LinkModal({ onInsert, onClose, initialText }) {
  const [text, setText] = useState(initialText || "")
  const [url, setUrl]   = useState("")
  const handleSave = () => {
    if (!url.trim()) return
    onInsert(text.trim(), url.trim())
    onClose()
  }
  return createPortal(
    <div
      style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", animation:"ttFadeIn 0.15s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`@keyframes ttFadeIn{from{opacity:0}to{opacity:1}}@keyframes ttSlideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes ttTipIn{from{opacity:0;transform:translateX(-50%) translateY(calc(-100% + 4px))}to{opacity:1;transform:translateX(-50%) translateY(-100%)}}`}</style>
      <div style={{ background:"var(--background,#111)", border:"1px solid var(--border,rgba(255,255,255,0.1))", borderRadius:14, padding:20, width:320, boxShadow:"0 20px 60px rgba(0,0,0,0.5)", animation:"ttSlideUp 0.18s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--foreground)" }}>Add Link</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted-foreground)", padding:4, borderRadius:6, display:"flex", alignItems:"center" }}><X size={16} /></button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={{ fontSize:11, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Text</label>
            <input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="Link text (optional)" style={{ width:"100%", fontSize:13, padding:"8px 12px", borderRadius:8, border:"1px solid var(--border)", background:"rgba(255,255,255,0.04)", color:"var(--foreground)", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ fontSize:11, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>URL <span style={{ color:"#ef4444" }}>*</span></label>
            <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="https://..." style={{ width:"100%", fontSize:13, padding:"8px 12px", borderRadius:8, border:"1px solid var(--border)", background:"rgba(255,255,255,0.04)", color:"var(--foreground)", outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:16 }}>
          <button onClick={onClose} style={{ padding:"6px 14px", fontSize:12, borderRadius:8, cursor:"pointer", border:"1px solid var(--border)", background:"none", color:"var(--muted-foreground)" }}>Cancel</button>
          <button onClick={handleSave} disabled={!url.trim()} style={{ padding:"6px 14px", fontSize:12, borderRadius:8, cursor:"pointer", border:"none", background:"#3b82f6", color:"#fff", fontWeight:600, opacity:url.trim()?1:0.4 }}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ─── Portal Tooltip ─────────────────────────────────────────── */
function Tooltip({ label, targetRef, visible }) {
  const [pos, setPos] = useState({ x:0, y:0 })
  useEffect(() => {
    if (visible && targetRef.current) {
      const r = targetRef.current.getBoundingClientRect()
      setPos({ x: r.left + r.width / 2, y: r.top - 8 })
    }
  }, [visible, targetRef])
  if (!visible) return null
  return createPortal(
    <div style={{ position:"fixed", left:pos.x, top:pos.y, transform:"translateX(-50%) translateY(-100%)", zIndex:99999, pointerEvents:"none", animation:"ttTipIn 0.12s ease forwards" }}>
      <div style={{ background:"rgba(10,10,16,0.95)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:500, color:"rgba(255,255,255,0.95)", letterSpacing:"0.01em", boxShadow:"0 6px 20px rgba(0,0,0,0.4)", whiteSpace:"nowrap", marginBottom:6 }}>{label}</div>
      <div style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%) rotate(45deg)", width:6, height:6, background:"rgba(10,10,16,0.95)", border:"1px solid rgba(255,255,255,0.12)", borderTop:"none", borderLeft:"none" }} />
    </div>,
    document.body
  )
}

/* ─── Toolbar Button ─────────────────────────────────────────── */
function ToolbarBtn({ onClick, title, children, active }) {
  const [hovered, setHovered] = useState(false)
  const btnRef = useRef(null)
  return (
    <>
      <button ref={btnRef} type="button"
        onMouseDown={e => { e.preventDefault(); onClick() }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:6, border:"none", flexShrink:0, background:active?"rgba(59,130,246,0.15)":hovered?"rgba(255,255,255,0.08)":"none", color:active?"#3b82f6":hovered?"var(--foreground)":"var(--muted-foreground)", cursor:"pointer", transition:"background 0.1s, color 0.1s" }}
      >{children}</button>
      <Tooltip label={title} targetRef={btnRef} visible={hovered} />
    </>
  )
}

function Divider() {
  return <div style={{ width:1, height:16, background:"var(--border)", margin:"0 3px", flexShrink:0 }} />
}

/* ─── Toolbar ────────────────────────────────────────────────── */
function Toolbar({ editor, onOpenLink }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2, padding:"5px 8px", borderBottom:"1px solid var(--border)", flexWrap:"wrap", background:"rgba(255,255,255,0.01)" }}>
      <ToolbarBtn title="Bold"          active={editor.isActive("bold")}          onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></ToolbarBtn>
      <ToolbarBtn title="Italic"        active={editor.isActive("italic")}        onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></ToolbarBtn>
      <ToolbarBtn title="Strikethrough" active={editor.isActive("strike")}        onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={13} /></ToolbarBtn>
      <Divider />
      <ToolbarBtn title="Heading 1"     active={editor.isActive("heading",{level:1})} onClick={() => editor.chain().focus().toggleHeading({level:1}).run()}><Heading1 size={13} /></ToolbarBtn>
      <ToolbarBtn title="Heading 2"     active={editor.isActive("heading",{level:2})} onClick={() => editor.chain().focus().toggleHeading({level:2}).run()}><Heading2 size={13} /></ToolbarBtn>
      <ToolbarBtn title="Heading 3"     active={editor.isActive("heading",{level:3})} onClick={() => editor.chain().focus().toggleHeading({level:3}).run()}><Heading3 size={13} /></ToolbarBtn>
      <Divider />
      <ToolbarBtn title="Code"          active={editor.isActive("code")}          onClick={() => editor.chain().focus().toggleCode().run()}><Code size={13} /></ToolbarBtn>
      <Divider />
      <ToolbarBtn title="Bullet list"   active={editor.isActive("bulletList")}    onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={13} /></ToolbarBtn>
      <ToolbarBtn title="Numbered list" active={editor.isActive("orderedList")}   onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={13} /></ToolbarBtn>
      <Divider />
      <ToolbarBtn title="Blockquote"    active={editor.isActive("blockquote")}    onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={13} /></ToolbarBtn>
      <Divider />
      <ToolbarBtn title="Insert link"   active={editor.isActive("link")}          onClick={onOpenLink}><LinkIcon size={13} /></ToolbarBtn>
      <Divider />
      <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo size={13} /></ToolbarBtn>
      <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo size={13} /></ToolbarBtn>
    </div>
  )
}

/* ─── Main Editor ────────────────────────────────────────────── */
// collapsibleToolbar — if true, toolbar starts hidden and can be toggled
//                      used in MobileReplyModal to keep UI clean
export default function TiptapEditor({ content, onChange, onSubmit, placeholder, autoFocus, collapsibleToolbar = false }) {
  const [linkModal, setLinkModal]     = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [toolbarOpen, setToolbarOpen] = useState(!collapsibleToolbar)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading:{levels:[1,2,3]}, code:{}, codeBlock:{}, blockquote:{}, bulletList:{}, orderedList:{}, bold:{}, italic:{}, strike:{} }),
      Link.configure({ openOnClick:false, HTMLAttributes:{ class:"tiptap-link" } }),
      Placeholder.configure({ placeholder: placeholder || "Write a reply…" }),
    ],
    content: content || "",
    autofocus: autoFocus ? "end" : false,
    onUpdate({ editor }) {
      const html = editor.getHTML()
      onChange(html === "<p></p>" ? "" : html)
    },
    editorProps: {
      handleKeyDown(view, event) {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault(); onSubmit?.(); return true
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (content === "" && editor.getText() !== "") editor.commands.clearContent()
  }, [content, editor])

  if (!editor) return null

  const openLinkModal = () => {
    const sel = editor.state.doc.cut(editor.state.selection.from, editor.state.selection.to).textContent
    setSelectedText(sel)
    setLinkModal(true)
  }

  const insertLink = (text, url) => {
    if (text && text !== selectedText) {
      editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  // Check if any formatting is active — shows dot indicator on toggle button
  const hasActiveFormat = editor.isActive("bold") || editor.isActive("italic") ||
    editor.isActive("strike") || editor.isActive("heading", {level:1}) ||
    editor.isActive("heading", {level:2}) || editor.isActive("heading", {level:3}) ||
    editor.isActive("code") || editor.isActive("bulletList") ||
    editor.isActive("orderedList") || editor.isActive("blockquote") || editor.isActive("link")

  return (
    <>
      <style>{`
        @keyframes ttFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes ttSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ttTipIn   { from{opacity:0;transform:translateX(-50%) translateY(calc(-100% + 4px))} to{opacity:1;transform:translateX(-50%) translateY(-100%)} }
        .tiptap-editor .ProseMirror { outline:none; min-height:68px; padding:10px 12px; font-size:14px; line-height:1.6; color:var(--foreground); }
        .tiptap-editor .ProseMirror p { margin:0.15em 0; }
        .tiptap-editor .ProseMirror h1 { font-size:1.3em; font-weight:700; margin:0.4em 0 0.2em; }
        .tiptap-editor .ProseMirror h2 { font-size:1.15em; font-weight:700; margin:0.4em 0 0.2em; }
        .tiptap-editor .ProseMirror h3 { font-size:1.05em; font-weight:600; margin:0.4em 0 0.2em; }
        .tiptap-editor .ProseMirror strong { font-weight:700; }
        .tiptap-editor .ProseMirror em { font-style:italic; }
        .tiptap-editor .ProseMirror s { text-decoration:line-through; opacity:0.7; }
        .tiptap-editor .ProseMirror code { font-family:monospace; font-size:0.85em; background:rgba(255,255,255,0.08); border-radius:4px; padding:1px 5px; border:1px solid rgba(255,255,255,0.1); color:#3b82f6; }
        .tiptap-editor .ProseMirror pre { background:rgba(255,255,255,0.05); border-radius:8px; padding:10px 14px; margin:6px 0; overflow-x:auto; border:1px solid rgba(255,255,255,0.08); }
        .tiptap-editor .ProseMirror pre code { background:none; border:none; padding:0; color:var(--foreground); font-size:0.82em; }
        .tiptap-editor .ProseMirror blockquote { border-left:2px solid rgba(59,130,246,0.5); padding-left:12px; margin:4px 0; color:var(--muted-foreground); font-style:italic; }
        .tiptap-editor .ProseMirror ul { list-style:disc; padding-left:20px; margin:4px 0; }
        .tiptap-editor .ProseMirror ol { list-style:decimal; padding-left:20px; margin:4px 0; }
        .tiptap-editor .ProseMirror li { margin:2px 0; }
        .tiptap-editor .ProseMirror a.tiptap-link { color:#3b82f6; text-decoration:underline; text-underline-offset:2px; cursor:pointer; }
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before { content:attr(data-placeholder); color:var(--muted-foreground); opacity:0.6; pointer-events:none; float:left; height:0; }
        @keyframes toolbar-slide { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .toolbar-animated { animation: toolbar-slide 0.15s ease; }
      `}</style>

      {/* Collapsible toolbar toggle — only shown when collapsibleToolbar=true */}
      {collapsibleToolbar && (
        <div style={{ display:"flex", alignItems:"center", padding:"4px 8px", borderBottom: toolbarOpen ? "none" : "1px solid var(--border)" }}>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setToolbarOpen(v => !v) }}
            style={{
              display:"flex", alignItems:"center", gap:5,
              padding:"3px 8px", borderRadius:6, border:"1px solid var(--border)",
              background: toolbarOpen ? "rgba(59,130,246,0.1)" : "none",
              color: toolbarOpen ? "#3b82f6" : "var(--muted-foreground)",
              cursor:"pointer", fontSize:11, fontWeight:500,
              transition:"all 0.15s",
              position:"relative",
            }}
          >
            <Bold size={11} />
            <span>Format</span>
            {/* Dot indicator when formatting is active */}
            {hasActiveFormat && (
              <span style={{ position:"absolute", top:2, right:2, width:5, height:5, borderRadius:"50%", background:"#3b82f6" }} />
            )}
          </button>
        </div>
      )}

      {/* TOOLBAR — animated slide in/out */}
      {toolbarOpen && (
        <div className="toolbar-animated">
          <Toolbar editor={editor} onOpenLink={openLinkModal} />
        </div>
      )}

      {/* EDITOR AREA */}
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>

      {linkModal && (
        <LinkModal initialText={selectedText} onClose={() => setLinkModal(false)} onInsert={insertLink} />
      )}
    </>
  )
}