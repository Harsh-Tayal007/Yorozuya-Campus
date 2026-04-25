import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { databases, ID } from "@/lib/appwrite"
import { DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID } from "@/config/appwrite"
import { UploadCloud, FileBox, User, Trash2, Edit2, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export default function MascotAssetManager() {
  const queryClient = useQueryClient()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["mascot-assets"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID)
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'vrm' && ext !== 'vrma') {
      toast.error("Only .vrm (Characters) and .vrma (Animations) files are allowed.")
      return
    }

    setUploading(true)
    const toastId = toast.loading(`Uploading ${file.name}...`)

    try {
      const workerUrl = import.meta.env.VITE_STORAGE_WORKER_URL
      const workerSecret = import.meta.env.VITE_STORAGE_SECRET
      const key = `yorozuya-mascots/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

      // 1. Upload to Cloudflare R2
      const uploadRes = await fetch(`${workerUrl}/upload?key=${key}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${workerSecret}`,
          "Content-Type": "application/octet-stream"
        },
        body: file
      })

      if (!uploadRes.ok) throw new Error("Failed to upload to storage bucket")

      const fileUrl = `${workerUrl}/file/${key}`
      const type = ext === 'vrma' ? 'animation' : 'character'
      let name = file.name.replace(/\.[^/.]+$/, "")

      // Format name nicely: "kiss_fox" -> "Kiss Fox"
      name = name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

      // 2. Save metadata to Appwrite
      await databases.createDocument(
        DATABASE_ID,
        MASCOT_ASSETS_COLLECTION_ID,
        ID.unique(),
        {
          name,
          type,
          fileUrl,
          fileKey: key,
          isDefault: false
        }
      )

      toast.success("Asset uploaded successfully!", { id: toastId })
      queryClient.invalidateQueries(["mascot-assets"])
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Upload failed", { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (asset) => {
      // Delete from R2 first
      const workerUrl = import.meta.env.VITE_STORAGE_WORKER_URL
      const workerSecret = import.meta.env.VITE_STORAGE_SECRET
      
      try {
        await fetch(`${workerUrl}/file/${asset.fileKey}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${workerSecret}` }
        })
      } catch (e) {
        console.warn("Failed to delete from R2, but proceeding to remove DB record", e)
      }

      // Delete from Appwrite
      await databases.deleteDocument(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID, asset.$id)
    },
    onSuccess: () => {
      toast.success("Asset deleted")
      queryClient.invalidateQueries(["mascot-assets"])
    },
    onError: (err) => {
      toast.error("Failed to delete: " + err.message)
    }
  })

  const renameMutation = useMutation({
    mutationFn: async ({ id, newName }) => {
      await databases.updateDocument(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID, id, { name: newName })
    },
    onSuccess: () => {
      toast.success("Renamed successfully")
      queryClient.invalidateQueries(["mascot-assets"])
      setEditingId(null)
    },
    onError: (err) => {
      toast.error("Failed to rename: " + err.message)
    }
  })

  const characters = assets.filter(a => a.type === "character")
  const animations = assets.filter(a => a.type === "animation")

  const renderAssetList = (items, typeName, Icon) => (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3 pl-1">
        <Icon size={16} /> {typeName}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground pl-1">No {typeName.toLowerCase()} uploaded yet.</p>
      ) : (
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.$id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl border border-border bg-card gap-3"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                {editingId === item.$id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-sm px-2 py-1 bg-background border border-border rounded flex-1 focus:outline-none focus:border-primary"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameMutation.mutate({ id: item.$id, newName: editName })
                        if (e.key === "Escape") setEditingId(null)
                      }}
                    />
                    <button onClick={() => renameMutation.mutate({ id: item.$id, newName: editName })} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate pr-4">{item.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{item.fileKey.split('/').pop()}</p>
                  </div>
                )}
              </div>

              {editingId !== item.$id && (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setEditingId(item.$id)
                      setEditName(item.name)
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Rename"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${item.name}?`)) {
                        deleteMutation.mutate(item)
                      }
                    }}
                    disabled={deleteMutation.isLoading && deleteMutation.variables?.$id === item.$id}
                    className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleteMutation.isLoading && deleteMutation.variables?.$id === item.$id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-colors duration-200 ease-out flex flex-col items-center justify-center text-center
                    ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
                    ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
          {uploading ? <Loader2 className="animate-spin" size={24} /> : <UploadCloud size={24} />}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {uploading ? "Uploading Asset..." : "Upload Mascot Asset"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Drag and drop a <strong className="text-foreground">.vrm</strong> character or <strong className="text-foreground">.vrma</strong> animation file, or click to browse.
        </p>

        <label className="cursor-pointer bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          Select File
          <input type="file" accept=".vrm,.vrma" className="hidden" onChange={handleChange} disabled={uploading} />
        </label>
      </div>

      <div className="h-px w-full bg-border" />

      {/* Lists */}
      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {renderAssetList(characters, "Characters", User)}
          {renderAssetList(animations, "Animations", FileBox)}
        </div>
      )}
    </div>
  )
}
