import { useQuery } from "@tanstack/react-query"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSubjectsForPyqSemester } from "@/services/pyqUserResolver"
import { getProgramById } from "@/services/programService"
import { BackButton, Breadcrumbs } from "@/components"
import GlowCard from "@/components/common/GlowCard"
import { ArrowUpRight } from "lucide-react"



const PyqSemesterSubjects = () => {
    const { programId, branchName, semester } = useParams()
    const navigate = useNavigate()

    const {
        data: subjects = [],
        isLoading: loadingSubjects,
        error: subjectsError,
    } = useQuery({
        queryKey: ["pyq-subjects", programId, semester],
        queryFn: () =>
            getSubjectsForPyqSemester({
                programId,
                semester: Number(semester),
            }),
        enabled: !!programId && !!semester,
    })



    const {
        data: program = null,
        isLoading: loadingProgram,
        error: programError,
    } = useQuery({
        queryKey: ["program", programId],
        queryFn: () => getProgramById(programId),
        enabled: !!programId,
    })

    if (subjectsError || programError) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-destructive">
                    Failed to load PYQ subjects.
                </p>
            </div>
        )
    }

    const decodedBranch = decodeURIComponent(branchName)

    const breadcrumbItems = [
        { label: "B.Tech", href: "/" },
        {
            label: decodedBranch,
            href: `/programs/${programId}/branches/${branchName}`,
        },
        {
            label: "PYQs",
            href: `/programs/${programId}/branches/${branchName}/pyqs`,
        },
        {
            label: `Semester ${semester}`,
        },
    ]




    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

            <BackButton
                to={`/programs/${programId}/branches/${branchName}/pyqs`}
                label="PYQs"
            />

            <Breadcrumbs items={breadcrumbItems} />

            <div>
                <h1 className="text-2xl font-bold">
                    PYQs
                </h1>
                <p className="text-muted-foreground">
                    {decodeURIComponent(branchName)}
                </p>
            </div>

            {loadingSubjects || loadingProgram ? (
                <p className="text-muted-foreground">Loading subjects...</p>
            ) : !semester ? (
                <p className="text-muted-foreground">Select a semester</p>
            ) : subjects.length === 0 ? (
                <p className="text-muted-foreground">
                    No PYQs available for this semester.
                </p>
            )
                : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {subjects.map((subject) => (
                            <GlowCard
                                key={subject.$id}
                                className="cursor-pointer"
                                onClick={() =>
                                    navigate(
                                        `/programs/${programId}/branches/${branchName}/pyqs/semester/${semester}/subject/${subject.$id}`,
                                        {
                                            state: { subjectName: subject.subjectName },
                                        }
                                    )
                                }
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {subject.subjectName}
                                    </CardTitle>

                                    {subject.description && (
                                        <CardDescription>
                                            {subject.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>

                                {/* Arrow Icon */}
                                <ArrowUpRight
                                    className="
          absolute bottom-4 right-4
          h-4 w-4
          text-muted-foreground
          opacity-70
          transition
          group-hover:opacity-100
        "
                                />
                            </GlowCard>
                        ))}
                    </div>
                )}
        </div>
    )
}

export default PyqSemesterSubjects
