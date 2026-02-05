import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getSubjectsBySyllabus } from "@/services/subjectService"
import { storage } from "@/lib/appwrite"

const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID


const SyllabusCard = ({ syllabus, onView, onEdit, onDelete }) => {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchSubjects = async () => {
      try {
        const res = await getSubjectsBySyllabus(syllabus.$id)
        if (mounted) setSubjects(res)
      } catch (err) {
        console.error("Failed to fetch subjects", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchSubjects()
    return () => (mounted = false)
  }, [syllabus.$id])

  // handler

  const handleView = async () => {
    if (subjects.length === 0) {
      alert("No subject PDF available")
      return
    }

    const pdfFileId = subjects[0].pdfFileId

    const fileUrl = storage.getFileView(BUCKET_ID, pdfFileId)

    window.open(fileUrl, "_blank")
  }


  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-start gap-6">
        <div className="space-y-2 max-w-[75%]">
          <h3 className="text-base font-semibold">{syllabus.title}</h3>

          <p className="text-sm">
            <span className="font-medium">Branch:</span>{" "}
            <span className="text-muted-foreground">{syllabus.branch}</span>
          </p>

          <p className="text-sm">
            <span className="font-medium">Semester:</span>{" "}
            <span className="text-muted-foreground">{syllabus.semester}</span>
          </p>

          {/* Subjects preview */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subjects added yet
            </p>
          ) : (
            <p className="text-sm">
              <span className="font-medium">Subject:</span>{" "}
              <span className="text-muted-foreground">
                {subjects.map((s) => s.subjectName).join(", ")}
              </span>
            </p>
          )}
        </div>

        {(onEdit || onDelete || onView) && (
          <div className="flex gap-2 shrink-0">
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={handleView}>
                View
              </Button>

              {onEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(syllabus)}>
                  Edit
                </Button>
              )}

              {onDelete && (
                <Button size="sm" variant="destructive" onClick={() => onDelete(syllabus)}>
                  Delete
                </Button>
              )}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SyllabusCard
