import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSemestersWithPyqs } from "@/services/pyqService"
import { Link } from "react-router-dom"
import { getProgramById } from "@/services/programService"


const PyqUserView = () => {
    const { programId, branchName } = useParams()
    const navigate = useNavigate()

    const [semesters, setSemesters] = useState([])
    const [loading, setLoading] = useState(true)

    const [program, setProgram] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [semesterData, programData] = await Promise.all([
                    getSemestersWithPyqs(programId),
                    getProgramById(programId),
                ])

                setSemesters(semesterData)
                setProgram(programData)
            } catch (err) {
                console.error("Failed to fetch PYQ data", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [programId])

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* 🔗 Temporary Breadcrumbs */}
            <div className="text-sm text-muted-foreground">
                <Link
                    to={`/programs`}
                    className="hover:underline"
                >
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
                <span className="text-foreground font-medium">
                    PYQs
                </span>
            </div>

            <div>
                <h1 className="text-2xl font-bold">PYQs</h1>
                <p className="text-muted-foreground mt-1">
                    {decodeURIComponent(branchName)}
                </p>
            </div>

            {loading ? (
                <p className="text-muted-foreground">Loading semesters...</p>
            ) : semesters.length === 0 ? (
                <p className="text-muted-foreground">
                    No PYQs available yet.
                </p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {semesters.map((sem) => (
                        <Card
                            key={sem}
                            onClick={() =>
                                navigate(
                                    `/programs/${programId}/branches/${branchName}/pyqs/semester/${sem}`
                                )
                            }
                            className="cursor-pointer hover:shadow-lg transition"
                        >
                            <CardHeader>
                                <CardTitle>Semester {sem}</CardTitle>
                                <CardDescription>
                                    View resources
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default PyqUserView
