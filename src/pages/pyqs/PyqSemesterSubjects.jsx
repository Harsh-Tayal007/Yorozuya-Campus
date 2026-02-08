import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { getSubjectsForPyqSemester } from "@/services/pyqUserResolver"
import { getProgramById } from "@/services/programService"



const PyqSemesterSubjects = () => {
    const { programId, branchName, semester } = useParams()
    const navigate = useNavigate()

    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [program, setProgram] = useState(null)


    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const [subjectData, programData] = await Promise.all([
                    getSubjectsForPyqSemester({
                        programId,
                        semester,
                    }),
                    getProgramById(programId),
                ])

                setSubjects(subjectData)
                setProgram(programData)
            } catch (err) {
                console.error("Failed to fetch PYQ subjects", err)
            } finally {
                setLoading(false)
            }
        }

        fetchSubjects()
    }, [programId, semester])


    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

            {/* 🔗 Temporary Breadcrumbs */}
            <div className="text-sm text-muted-foreground">
                <Link to="/programs" className="hover:underline">
                    Programs
                </Link>
                {" → "}
                <Link
                    to={`/programs/${programId}`}
                    className="hover:underline"
                >
                    {program?.name || "Program"}
                </Link>
                {" → "}
                <Link
                    to={`/programs/${programId}/branches/${branchName}`}
                    className="hover:underline"
                >
                    {decodeURIComponent(branchName)}
                </Link>
                {" → "}
                <Link
                    to={`/programs/${programId}/branches/${branchName}/pyqs`}
                    className="hover:underline"
                >
                    PYQs
                </Link>
                {" → "}
                <span className="text-foreground font-medium">
                    Semester {semester}
                </span>
            </div>

            <div>
                <h1 className="text-2xl font-bold">
                    PYQs
                </h1>
                <p className="text-muted-foreground">
                    {decodeURIComponent(branchName)}
                </p>
            </div>

            {loading ? (
                <p className="text-muted-foreground">Loading subjects...</p>
            ) : subjects.length === 0 ? (
                <p className="text-muted-foreground">
                    No PYQs available for this semester.
                </p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                        <Card
                            key={subject.$id}
                            onClick={() =>
                                navigate(
                                    `/programs/${programId}/branches/${branchName}/pyqs/semester/${semester}/subject/${subject.$id}`
                                )
                            }
                            className="cursor-pointer hover:shadow-lg transition"
                        >
                            <CardHeader>
                                <CardTitle>🗒️{subject.subjectName}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default PyqSemesterSubjects
