// src/pages/admin/branches/BranchesAdmin.jsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/services/university/branchService"
import {
  ChevronDown, ChevronRight, Plus, Pencil, Trash2,
  Loader2, X, GitBranch, AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const DATABASE_ID  = import.meta.env.VITE_APPWRITE_DATABASE_ID
const PROGRAMS_COL = import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID

// ── Modal ─────────────────────────────────────────────────────────────────────
function BranchModal({ mode, branch, programName, onClose, onSave, isSaving }) {
  const [name, setName]               = useState(branch?.name ?? "")
  const [description, setDescription] = useState(branch?.description ?? "")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name, description })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-background border border-border
                   rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">
              {mode === "add" ? "Add Branch" : "Edit Branch"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{programName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Branch Name *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Computer Science Engineering"
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30
                         text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30
                         text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                         hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || isSaving}
              className="flex-1 h-10 rounded-xl bg-purple-600 text-white text-sm font-semibold
                         hover:bg-purple-700 disabled:opacity-60 transition-colors
                         flex items-center justify-center gap-2">
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {mode === "add" ? "Add Branch" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ branchName, onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm bg-background border border-border
                   rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-11 h-11 rounded-full
                        bg-destructive/10 border border-destructive/20 mx-auto">
          <AlertTriangle size={20} className="text-destructive" />
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="font-semibold text-base">Delete branch?</h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">"{branchName}"</span>
            {" "}will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                       hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground
                       text-sm font-semibold hover:bg-destructive/90 disabled:opacity-60
                       transition-colors flex items-center justify-center gap-2">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BranchesAdmin() {
  const queryClient = useQueryClient()
  const [expandedPrograms, setExpandedPrograms] = useState({})
  const [modal, setModal]             = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["programs-all"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, PROGRAMS_COL, [
        Query.orderAsc("name"), Query.limit(200),
      ])
      return res.documents
    },
    staleTime: 1000 * 60 * 5,
  })

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["branches-all"],
    queryFn: getAllBranches,
    staleTime: 1000 * 60 * 5,
  })

  // Group by programId
  const byProgram = branches.reduce((acc, b) => {
    ;(acc[b.programId] ??= []).push(b)
    return acc
  }, {})

  const toggleProgram = (id) =>
    setExpandedPrograms(prev => ({ ...prev, [id]: !prev[id] }))

  const createMutation = useMutation({
    mutationFn: (data) => createBranch(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["branches-all"] }); setModal(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateBranch(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["branches-all"] }); setModal(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBranch(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["branches-all"] }); setDeleteTarget(null) },
  })

  const handleSave = (formData) => {
    if (modal.mode === "add")
      createMutation.mutate({ ...formData, programId: modal.programId })
    else
      updateMutation.mutate({ id: modal.branch.$id, data: formData })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (programsLoading || branchesLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  return (
    <>
      {modal && (
        <BranchModal
          mode={modal.mode}
          branch={modal.branch}
          programName={modal.programName}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          branchName={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {branches.length} branch{branches.length !== 1 ? "es" : ""} across {programs.length} programs
          </p>
        </div>

        <div className="space-y-3">
          {programs.map((program) => {
            const programBranches = byProgram[program.$id] ?? []
            const isExpanded = !!expandedPrograms[program.$id]

            return (
              <Card key={program.$id} className="overflow-hidden">
                {/* Program row */}
                <button
                  onClick={() => toggleProgram(program.$id)}
                  className="w-full flex items-center justify-between px-5 py-4
                             hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded
                      ? <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                      : <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                    }
                    <span className="font-semibold text-sm">{program.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {programBranches.length} {programBranches.length === 1 ? "branch" : "branches"}
                    </span>
                  </div>

                  {/* Add button - stopPropagation so it doesn't toggle expand */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setModal({ mode: "add", programId: program.$id, programName: program.name })
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-purple-600
                               hover:text-purple-700 px-2.5 py-1.5 rounded-lg
                               hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                  >
                    <Plus size={13} /> Add Branch
                  </button>
                </button>

                {/* Branches list */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {programBranches.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <GitBranch size={20} className="mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">No branches yet</p>
                        <button
                          onClick={() => setModal({ mode: "add", programId: program.$id, programName: program.name })}
                          className="mt-2 text-sm text-purple-600 hover:underline"
                        >
                          Add the first branch
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {programBranches.map((branch) => (
                          <div key={branch.$id}
                            className="flex items-center justify-between px-5 py-3.5
                                       hover:bg-muted/30 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{branch.name}</p>
                              {branch.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {branch.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-3">
                              <button
                                onClick={() => setModal({
                                  mode: "edit",
                                  branch,
                                  programId: program.$id,
                                  programName: program.name,
                                })}
                                className="p-1.5 rounded-lg text-muted-foreground
                                           hover:text-foreground hover:bg-muted transition-colors"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ id: branch.$id, name: branch.name })}
                                className="p-1.5 rounded-lg text-muted-foreground
                                           hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}