import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { BTECH_BRANCHES } from "@/constants/branches"
import { FileText, ExternalLink } from "lucide-react"
import { getSubjectsBySyllabusIds } from "@/services/subjectService"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const PROGRAMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID


export default function ResourcesUserView() {
  const [programId, setProgramId] = useState("")
  const [programs, setPrograms] = useState([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [semester, setSemester] = useState("")
  const [branch, setBranch] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [unitId, setUnitId] = useState("")
  const [units, setUnits] = useState([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [resources, setResources] = useState([])
  const [loadingResources, setLoadingResources] = useState(false)



  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true)

      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          PROGRAMS_COLLECTION_ID
        )


        setPrograms(res.documents)
      } catch (err) {
        console.error("Failed to load programs", err)
      } finally {
        setLoadingPrograms(false)
      }
    }

    fetchPrograms()
  }, [])

  useEffect(() => {
    if (!programId || !semester || !branch) {
      setSyllabusIds([])
      setSubjects([])
      setSubjectId("")
      return
    }

    const fetchSyllabusIds = async () => {
      setLoadingSubjects(true)

      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID,
          [
            Query.equal("programId", programId),
            Query.equal("semester", Number(semester)),
            Query.equal("branch", branch),
          ]
        )

        const ids = res.documents.map(doc => doc.$id)
        setSyllabusIds(ids)
      } catch (err) {
        console.error("Failed to load syllabus", err)
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSyllabusIds()
  }, [programId, semester, branch])

  useEffect(() => {
    if (!syllabusIds.length) {
      setSubjects([])
      setSubjectId("")
      return
    }

    const fetchSubjects = async () => {
      setLoadingSubjects(true)

      try {
        const subjectDocs = await getSubjectsBySyllabusIds(syllabusIds)
        setSubjects(subjectDocs)
      } catch (err) {
        console.error("Failed to load subjects", err)
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [syllabusIds])



  useEffect(() => {
    if (!subjectId) {
      setUnits([])
      setUnitId("")
      return
    }

    const fetchUnits = async () => {
      setLoadingUnits(true)

      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID,
          [
            Query.equal("subjectId", subjectId), // ✅ ONLY THIS
          ]
        )

        setUnits(res.documents)
      } catch (err) {
        console.error("Failed to load units", err)
      } finally {
        setLoadingUnits(false)
      }
    }

    fetchUnits()
  }, [subjectId])

  useEffect(() => {
    if (!unitId) {
      setResources([])
      return
    }

    const fetchResources = async () => {
      setLoadingResources(true)

      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID,
          [
            Query.equal("unitId", unitId),
          ]
        )

        setResources(res.documents)
      } catch (err) {
        console.error("Failed to load resources", err)
      } finally {
        setLoadingResources(false)
      }
    }

    fetchResources()
  }, [unitId])




  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Program Select */}
            <div className="max-w-sm">
              <Select
                value={programId}
                onValueChange={(value) => {
                  setProgramId(value)
                  setSemester("")
                  setBranch("")
                  setSubjectId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingPrograms ? "Loading programs..." : "Select Program"}
                  />
                </SelectTrigger>

                <SelectContent>
                  {programs.map(program => (
                    <SelectItem key={program.$id} value={program.$id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester Select */}
            {programId && (
              <div className="max-w-sm">
                <Select
                  value={semester}
                  onValueChange={(value) => {
                    setSemester(value)
                    setBranch("")
                    setSubjectId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>

                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={String(num)}>
                        Semester {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Branch Select */}
            {semester && (
              <div className="max-w-sm">
                <Select
                  value={branch}
                  onValueChange={(value) => {
                    setBranch(value)
                    setSubjectId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>

                  <SelectContent>
                    {BTECH_BRANCHES.map(branchName => (
                      <SelectItem key={branchName} value={branchName}>
                        {branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject Select */}
            {branch && (
              <div className="max-w-sm">
                <Select
                  value={subjectId}
                  onValueChange={(value) => {
                    setSubjectId(value)
                    setUnitId("")
                  }}

                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingSubjects
                          ? "Loading subjects..."
                          : "Select Subject"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.$id} value={subject.$id}>
                        {subject.title}
                      </SelectItem>
                    ))}

                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Unit Select */}
            {subjectId && (
              <div className="max-w-sm">
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingUnits
                          ? "Loading units..."
                          : "Select Unit"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.$id} value={unit.$id}>
                        {unit.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Resources List */}
            {unitId && (
              <div className="space-y-4">
                {loadingResources && (
                  <p className="text-sm text-muted-foreground">
                    Loading resources...
                  </p>
                )}

                {!loadingResources && resources.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No resources available for this unit.
                  </p>
                )}

                {resources.map(resource => (

                  <Card key={resource.$id} className="hover:shadow-md transition">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-semibold">
                            {resource.title}
                          </CardTitle>

                          {/* BADGE */}
                          {resource.type?.toLowerCase() === "pdf" && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                              <FileText className="h-3 w-3" />
                              PDF
                            </span>
                          )}

                          {resource.type?.toLowerCase() === "link" && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                              <ExternalLink className="h-3 w-3" />
                              LINK
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>


                    <CardContent className="space-y-3">
                      {resource.description && (
                        <p className="text-sm text-muted-foreground">
                          {resource.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        {resource.type?.toLowerCase() === "link" && resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition"
                          >
                            <ExternalLink className="h-4 w-4 text-blue-600" />
                            <span>Open Link</span>
                          </a>
                        )}

                        {resource.type?.toLowerCase() === "pdf" && resource.fileId && (
                          <a
                            href={`${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID}/files/${resource.fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition"
                          >
                            <FileText className="h-4 w-4 text-red-600" />
                            <span>View PDF</span>
                          </a>
                        )}
                      </div>



                    </CardContent>
                  </Card>

                ))}
              </div>
            )}


            {!programId && <p className="text-sm text-muted-foreground">Select a program to begin.</p>}
            {programId && !semester && <p className="text-sm text-muted-foreground">Now select a semester.</p>}
            {semester && !branch && <p className="text-sm text-muted-foreground">Choose your branch.</p>}
            {branch && !subjectId && <p className="text-sm text-muted-foreground">Pick a subject.</p>}
            {subjectId && !unitId && <p className="text-sm text-muted-foreground">Select a unit to view resources.</p>}


          </CardContent>

        </Card>
      </div>
    </div>
  )
}
