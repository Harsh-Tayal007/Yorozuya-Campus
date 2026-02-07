import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

import { Query } from "appwrite"
import { databases } from "@/lib/appwrite"
import { getSyllabusByContext } from "@/services/syllabusService"
import { getPdfViewUrl } from "@/services/storageService"


const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const SYLLABUS_COLLECTION = import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID
const SUBJECTS_COLLECTION = import.meta.env.VITE_APPWRITE_SUBJECTS_COLLECTION_ID
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID
const RESOURCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID


export default function ResourcesUserView() {
  const { programId, branchName, semester, subjectId, unitId } = useParams()

  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [units, setUnits] = useState([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [resources, setResources] = useState([])
  const [loadingResources, setLoadingResources] = useState(false)
  const [currentSubject, setCurrentSubject] = useState(null)
  const [currentUnit, setCurrentUnit] = useState(null)



  const decodedBranch = decodeURIComponent(branchName)

  async function getSubjectsBySemesterContext({ programId, branch, semester }) {
    const syllabusRes = await databases.listDocuments(
      DATABASE_ID,
      SYLLABUS_COLLECTION,
      [
        Query.equal("programId", programId),
        Query.equal("branch", branch),
        Query.equal("semester", Number(semester)),
      ]
    )

    const syllabusIds = syllabusRes.documents.map(doc => doc.$id)

    if (!syllabusIds.length) return []

    const subjectsRes = await databases.listDocuments(
      DATABASE_ID,
      SUBJECTS_COLLECTION,
      [
        Query.equal("syllabusId", syllabusIds),
        Query.orderAsc("subjectName"),
      ]
    )

    return subjectsRes.documents
  }

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true)
        setError(null)

        const subjectDocs = await getSubjectsBySemesterContext({
          programId,
          branch: decodedBranch,
          semester,
        })

        setSubjects(subjectDocs)
      } catch (err) {
        console.error(err)
        setError("Subjects not found")
      } finally {
        setLoading(false)
      }
    }

    if (programId && decodedBranch && semester) {
      fetchSubjects()
    }
  }, [programId, decodedBranch, semester])

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoadingUnits(true)

        const res = await databases.listDocuments(
          DATABASE_ID,
          UNITS_COLLECTION_ID,
          [
            Query.equal("subjectId", subjectId),
            Query.orderAsc("order"),
          ]
        )

        setUnits(res.documents)
      } catch (err) {
        console.error("Failed to load units", err)
      } finally {
        setLoadingUnits(false)
      }
    }

    if (subjectId) {
      fetchUnits()
    }
  }, [subjectId])

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoadingResources(true)

        const res = await databases.listDocuments(
          DATABASE_ID,
          RESOURCES_COLLECTION_ID,
          [
            Query.equal("unitId", unitId),
            Query.orderDesc("$createdAt"),
          ]
        )

        setResources(res.documents)
      } catch (err) {
        console.error("Failed to load resources", err)
      } finally {
        setLoadingResources(false)
      }
    }

    if (unitId) {
      fetchResources()
    }
  }, [unitId])

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const res = await databases.getDocument(
          DATABASE_ID,
          SUBJECTS_COLLECTION,
          subjectId
        )
        setCurrentSubject(res)
      } catch (err) {
        console.error("Failed to fetch subject", err)
      }
    }

    if (subjectId) {
      fetchSubject()
    } else {
      setCurrentSubject(null)
    }
  }, [subjectId])


  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const res = await databases.getDocument(
          DATABASE_ID,
          UNITS_COLLECTION_ID,
          unitId
        )
        setCurrentUnit(res)
      } catch (err) {
        console.error("Failed to fetch unit", err)
      }
    }

    if (unitId) {
      fetchUnit()
    } else {
      setCurrentUnit(null)
    }
  }, [unitId])



  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* 🧭 Breadcrumb */}
      {semester && (
        <p className="text-sm text-muted-foreground">
          B.Tech → {decodedBranch}
          {semester && ` → Semester ${semester}`}
          {currentSubject && ` → ${currentSubject.subjectName}`}
          {currentUnit && ` → ${currentUnit.title}`}
        </p>
      )}


      {/* 🧾 Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">
          Resources
        </h1>
        <p className="text-muted-foreground">
          {decodedBranch}
        </p>
      </div>

      {/* 📦 Semester Cards */}
      {!semester && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <Card
              key={sem}
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() =>
                navigate(
                  `/programs/${programId}/branches/${branchName}/resources/${sem}`
                )
              }
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  Semester {sem}
                </CardTitle>
                <CardDescription>
                  View resources
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* 📘 Subjects */}
      {semester && !subjectId && (
        <>
          {loading && (
            <div className="text-center text-muted-foreground">
              Loading subjects...
            </div>
          )}

          {!loading && subjects.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No subjects uploaded for this semester yet.
            </div>
          )}

          {!loading && subjects.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map(subject => (
                <Card
                  key={subject.$id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() =>
                    navigate(
                      `/programs/${programId}/branches/${branchName}/resources/${semester}/${subject.$id}`
                    )
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      📄 {subject.subjectName}
                    </CardTitle>

                    {subject.description && (
                      <CardDescription>
                        {subject.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )}


      {/* 📘 Units */}
      {subjectId && !unitId && (
        <>
          {loadingUnits && (
            <div className="text-center text-muted-foreground">
              Loading units...
            </div>
          )}

          {!loadingUnits && units.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No units added for this subject yet.
            </div>
          )}

          {!loadingUnits && units.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {units.map(unit => (
                <Card
                  key={unit.$id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() =>
                    navigate(
                      `/programs/${programId}/branches/${branchName}/resources/${semester}/${subjectId}/${unit.$id}`
                    )
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {unit.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* 📚 Resources */}
      {unitId && (
        <>
          {loadingResources && (
            <div className="text-center text-muted-foreground">
              Loading resources...
            </div>
          )}

          {!loadingResources && resources.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No resources uploaded for this unit yet.
            </div>
          )}

          {!loadingResources && resources.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map(resource => (
                <Card
                  key={resource.$id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => {

                    if (resource.type === "pdf" && resource.fileId) {
                      window.open(
                        getPdfViewUrl(resource.fileId),
                        "_blank"
                      )
                    }

                    if (resource.type === "link" && resource.url) {
                      window.open(resource.url, "_blank")
                    }
                  }}


                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {resource.type === "pdf" ? "📄" : "▶️"}
                    </CardTitle>

                    {resource.description && (
                      <CardDescription>
                        {resource.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )}


    </div>
  )
}
