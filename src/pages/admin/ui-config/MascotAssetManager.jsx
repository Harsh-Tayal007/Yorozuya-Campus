import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { databases, ID, Query } from "@/lib/appwrite"
import { DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID } from "@/config/appwrite"
import { UploadCloud, FileBox, User, Trash2, Edit2, Check, X, Loader2, Star } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { useUIPrefs } from "@/context/UIPrefsContext"
import { updateSiteConfig } from "@/services/ui/uiConfigService"

export default function MascotAssetManager() {
  const { adminDefaults, refreshSiteConfig } = useUIPrefs()
  const queryClient = useQueryClient()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["mascot-assets"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID, [Query.limit(100)])
      return res.documents
    },
  })

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave" || e.type === "drop") setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0])
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0])
  }

  const handleFileUpload = async (file) => {
    const ext = file.name.split(".").pop().toLowerCase()
    if (ext !== "vrm" && ext !== "vrma") {
      toast.error("Only .vrm (Characters) and .vrma (Animations) files are allowed.")
      return
    }

    setUploading(true)
    const toastId = toast.loading(`Uploading ${file.name}...`)

    try {
      const workerUrl = import.meta.env.VITE_STORAGE_WORKER_URL
      const workerSecret = import.meta.env.VITE_STORAGE_SECRET
      const key = `yorozuya-mascots/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

      const uploadRes = await fetch(`${workerUrl}/upload?key=${key}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${workerSecret}`,
          "Content-Type": "application/octet-stream",
        },
        body: file,
      })

      if (!uploadRes.ok) throw new Error("Failed to upload to storage bucket")

      const fileUrl = `${workerUrl}/file/${key}`
      const type = ext === "vrma" ? "animation" : "character"
      let name = file.name.replace(/\.[^/.]+$/, "")
      name = name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

      await databases.createDocument(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID, ID.unique(), {
        name,
        type,
        fileUrl,
        fileKey: key,
        isDefault: false,
      })

      toast.success("Asset uploaded successfully!", { id: toastId })
      queryClient.invalidateQueries({ queryKey: ["mascot-assets"] })
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Upload failed", { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (asset) => {
      const workerUrl = import.meta.env.VITE_STORAGE_WORKER_URL
      const workerSecret = import.meta.env.VITE_STORAGE_SECRET
      try {
        await fetch(`${workerUrl}/file/${asset.fileKey}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${workerSecret}` },
        })
      } catch (e) {
        console.warn("Failed to delete from R2, proceeding to remove DB record", e)
      }
      await databases.deleteDocument(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID, asset.$id)
    },
    onSuccess: () => {
      toast.success("Asset deleted")
      queryClient.invalidateQueries({ queryKey: ["mascot-assets"] })
    },
    onError: (err) => toast.error("Failed to delete: " + err.message),
  })

  const renameMutation = useMutation({
    mutationFn: async ({ id, newName }) => {
      await databases.updateDocument(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID, id, { name: newName })
    },
    onSuccess: () => {
      toast.success("Renamed successfully")
      queryClient.invalidateQueries({ queryKey: ["mascot-assets"] })
      setEditingId(null)
    },
    onError: (err) => toast.error("Failed to rename: " + err.message),
  })

  const characters = assets.filter((a) => a.type === "character")
  const animations = assets.filter((a) => a.type === "animation")

  const AssetRow = ({ item, Icon }) => {
    const isEditing = editingId === item.$id
    const isDeleting = deleteMutation.isPending && deleteMutation.variables?.$id === item.$id
    
    // Check if this is the default
    const isDefaultCharacter = item.type === "character" && adminDefaults?.default_character === item.fileUrl
    
    let isDefaultAnimation = false
    try {
      const defAnims = JSON.parse(adminDefaults?.default_animations || "[]")
      isDefaultAnimation = item.type === "animation" && Array.isArray(defAnims) && defAnims.includes(item.fileUrl)
    } catch { }

    const isDefault = isDefaultCharacter || isDefaultAnimation

    const handleToggleDefault = async () => {
      try {
        if (item.type === "character") {
          await updateSiteConfig({ default_character: item.fileUrl })
          refreshSiteConfig()
          toast.success("Default character updated globally")
        } else {
          // For animations, we manage an array of defaults
          let defAnims = []
          try {
            defAnims = JSON.parse(adminDefaults?.default_animations || "[]")
          } catch { }
          
          if (isDefaultAnimation) {
            defAnims = defAnims.filter(url => url !== item.fileUrl)
          } else {
            defAnims.push(item.fileUrl)
          }
          await updateSiteConfig({ default_animations: JSON.stringify(defAnims) })
          refreshSiteConfig()
          toast.success(isDefaultAnimation ? "Removed from default sequence" : "Added to default sequence")
        }
      } catch (err) {
        toast.error("Failed to update default: " + err.message)
      }
    }

    return (
      <motion.div
        key={item.$id}
        layout
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors group"
      >
        {/* Icon */}
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={13} className="text-primary" />
        </div>

        {/* Name / edit input — fills remaining space, min-w-0 prevents overflow */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs px-2 py-1 bg-background border border-border rounded focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") renameMutation.mutate({ id: item.$id, newName: editName })
                if (e.key === "Escape") setEditingId(null)
              }}
            />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-foreground truncate leading-tight">{item.name}</p>
                {isDefault && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary tracking-wider uppercase">
                    {item.type === "character" ? "Global Default" : "Default Seq"}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground truncate leading-tight opacity-60">
                {item.fileKey.split("/").pop()}
              </p>
            </>
          )}
        </div>

        {/* Action buttons — always shrink-0 so they never get pushed out */}
        <div className="flex items-center gap-0.5 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={() => renameMutation.mutate({ id: item.$id, newName: editName })}
                className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-md transition-colors"
                title="Save"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                title="Cancel"
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleDefault}
                className={`p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${isDefault ? "text-amber-500 hover:bg-amber-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                title={isDefault ? "Remove Default" : "Set as Default"}
              >
                <Star size={13} className={isDefault ? "fill-amber-500" : ""} />
              </button>
              <button
                onClick={() => { setEditingId(item.$id); setEditName(item.name) }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors opacity-0 group-hover:opacity-100"
                title="Rename"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => { if (window.confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item) }}
                disabled={isDeleting || isDefault}
                className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Delete"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  const AssetPanel = ({ items, label, Icon, emptyLabel }) => (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-card/40">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Icon size={13} />
          {label}
        </div>
        <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {/* Scrollable list — fixed height, independent scroll */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "420px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <Icon size={24} className="opacity-20" />
            <p className="text-xs">{emptyLabel}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <AssetRow key={item.$id} item={item} Icon={Icon} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {/* ── Upload zone — compact horizontal strip ── */}
      <div
        className={[
          "relative border-2 border-dashed rounded-xl px-5 py-4 transition-colors duration-200",
          "flex items-center gap-4",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/20",
          uploading ? "opacity-50 pointer-events-none" : "",
        ].join(" ")}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {uploading ? "Uploading…" : "Upload Mascot Asset"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            Drop a <strong className="text-foreground">.vrm</strong> character or{" "}
            <strong className="text-foreground">.vrma</strong> animation file here
          </p>
        </div>
        <label className="cursor-pointer shrink-0 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap">
          Select File
          <input type="file" accept=".vrm,.vrma" className="hidden" onChange={handleChange} disabled={uploading} />
        </label>
      </div>

      {/* ── Side-by-side panels — equal height, independent scroll ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <AssetPanel
          items={characters}
          label="Characters"
          Icon={User}
          emptyLabel="No characters uploaded yet"
        />
        <AssetPanel
          items={animations}
          label="Animations"
          Icon={FileBox}
          emptyLabel="No animations uploaded yet"
        />
      </div>
    </div>
  )
}
