import { useState } from "react"
import {
  createUniversity,
  deleteUniversity,
  updateUniversity,
  getUniversities,
} from "@/services/university/universityService"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import UniversityCard from "@/components/university/UniversityCard"

import { useAuth } from "@/context/AuthContext";

import { useNavigate } from "react-router-dom"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"



const Universities = () => {
  const { currentUser, hasPermission } = useAuth()
  const canManage = hasPermission("manage:universities")


  const [form, setForm] = useState({
    name: "",
    country: "",
    city: "",
    website: "",
  })

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [editingUniversity, setEditingUniversity] = useState(null)

  const isEditing = Boolean(editingUniversity)

  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const createMutation = useMutation({
  mutationFn: (data) => createUniversity(data, currentUser),
  onSuccess: () => {
    queryClient.invalidateQueries(["universities"])
    setForm({ name: "", country: "", city: "", website: "" })
    setSuccess(true)
    toast.success("University created")
  },
  onError: () => {
    toast.error("Failed to create university.")
  },
})

  const {
    data: universities = [],
    isLoading: loadingList,
  } = useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
  })


  // -------------------------
  // CREATE
  // -------------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!canManage) {
      setError("You are not allowed to create universities.")
      return
    }

    if (!form.name || !form.country) {
      setError("University name and country are required.")
      return
    }

    createMutation.mutate(form)
  }


  // -------------------------
  // DELETE (Optimistic)
  // -------------------------

  const deleteMutation = useMutation({
    mutationFn: ({ id, name }) =>
      deleteUniversity(id, currentUser, name),
    onSuccess: () => {
      queryClient.invalidateQueries(["universities"])
      toast.success("University deleted")
    },
  })

  const handleDelete = (id) => {
    if (!canManage) {
      toast.error("You don't have permission to delete universities.")
      return
    }

    const university = universities.find((u) => u.$id === id)

    toast(`Delete "${university.name}"?`, {
      action: {
        label: "Delete",
        onClick: () => deleteMutation.mutate({ id, name: university.name }),
      },
      cancel: { label: "Cancel", onClick: () => {} },
    })
  }


  // -------------------------
  // UPDATE (Optimistic)
  // -------------------------

  const updateMutation = useMutation({
    mutationFn: (updated) =>
      updateUniversity(
        updated.$id,
        {
          name: updated.name,
          country: updated.country,
          city: updated.city,
          website: updated.website,
        },
        currentUser
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["universities"])
      setEditingUniversity(null)
      toast.success("University updated")
    },
  })


  const handleUpdate = () => {
    if (!canManage) {
      toast.error("You don't have permission to edit universities.")
      return
    }

    updateMutation.mutate(editingUniversity)
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* ADD UNIVERSITY */}

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? "Edit University" : "Add University"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                isEditing ? handleUpdate() : handleSubmit(e)
              }}
              className={`space-y-4 ${!canManage ? "opacity-60 pointer-events-none" : ""}`}
            >
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={isEditing ? editingUniversity.name : form.name}
                  onChange={(e) =>
                    isEditing
                      ? setEditingUniversity({
                        ...editingUniversity,
                        name: e.target.value,
                      })
                      : handleChange(e)
                  }
                  name="name"
                  placeholder="University of Tokyo"
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label>Country *</Label>
                <Input
                  value={isEditing ? editingUniversity.country : form.country}
                  onChange={(e) =>
                    isEditing
                      ? setEditingUniversity({
                        ...editingUniversity,
                        country: e.target.value,
                      })
                      : handleChange(e)
                  }
                  name="country"
                  placeholder="Japan"
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={isEditing ? editingUniversity.city || "" : form.city}
                  onChange={(e) =>
                    isEditing
                      ? setEditingUniversity({
                        ...editingUniversity,
                        city: e.target.value,
                      })
                      : handleChange(e)
                  }
                  name="city"
                  placeholder="Tokyo"
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={isEditing ? editingUniversity.website || "" : form.website}
                  onChange={(e) =>
                    isEditing
                      ? setEditingUniversity({
                        ...editingUniversity,
                        website: e.target.value,
                      })
                      : handleChange(e)
                  }
                  name="website"
                  placeholder="https://www.u-tokyo.ac.jp"
                  disabled={!canManage}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={!canManage}>
                  {isEditing ? "Save Changes" : "Create University"}
                </Button>

                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingUniversity(null)}
                    disabled={!canManage}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}


      {/* LIST */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Universities</h2>

        {loadingList && <p>Loading universities...</p>}

        {!loadingList && universities.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No universities added yet.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((uni) => (
            <UniversityCard
              key={uni.$id}
              university={uni}
              onClick={() => navigate(`/university/${uni.$id}`)}
              onDelete={canManage ? handleDelete : null}
              onEdit={canManage ? () => setEditingUniversity(uni) : null}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

export default Universities