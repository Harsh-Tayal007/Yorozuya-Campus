// src/components/common/FileTypeBadge.jsx
import { FileText, Video, Link as LinkIcon, Archive, Image as ImageIcon } from "lucide-react"

const FILE_TYPE_CONFIG = {
  pdf:   { label: "PDF",   icon: FileText,  accent: "#ef4444" },
  video: { label: "Video", icon: Video,     accent: "#8b5cf6" },
  link:  { label: "Link",  icon: LinkIcon,  accent: "#06b6d4" },
  notes: { label: "Notes", icon: FileText,  accent: "#f59e0b" },
  image: { label: "Image", icon: ImageIcon, accent: "#10b981" },
  zip:   { label: "ZIP",   icon: Archive,   accent: "#6b7280" },
}

const FileTypeBadge = ({ fileType = "pdf", onPreview }) => {
  const key = fileType?.toLowerCase()
  const cfg = FILE_TYPE_CONFIG[key] ?? FILE_TYPE_CONFIG.pdf
  const Icon = cfg.icon

  return (
    <button
      type="button"
      onClick={onPreview}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1
                 transition-all duration-150 active:scale-95 focus:outline-none"
      style={{ background: `${cfg.accent}15`, border: `1px solid ${cfg.accent}30` }}
      title={`${cfg.label} file`}
    >
      <Icon size={12} style={{ color: cfg.accent }} />
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: cfg.accent }}>
        {cfg.label}
      </span>
    </button>
  )
}

export default FileTypeBadge