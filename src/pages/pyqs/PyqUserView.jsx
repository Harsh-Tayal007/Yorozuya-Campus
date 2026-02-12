import { useParams, useNavigate } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSemestersWithPyqs } from "@/services/pyqService"
import { getProgramById } from "@/services/programService"
import { BackButton, Breadcrumbs } from "@/components"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight } from "lucide-react"
import GlowCard from "@/components/common/GlowCard"


const PyqUserView = () => {
    const { programId, branchName } = useParams()
    const navigate = useNavigate()

    const decodedBranch = decodeURIComponent(branchName)

    const {
        data: semesters = [],
        isLoading: loadingSemesters,
        error: semestersError,
    } = useQuery({
        queryKey: ["pyq-semesters", programId],
        queryFn: () => getSemestersWithPyqs(programId),
        enabled: !!programId,
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

    if (semestersError || programError) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <p className="text-destructive">
                    Failed to load PYQs.
                </p>
            </div>
        )
    }

    const breadcrumbItems = [
        { label: "B.Tech", href: "/" },
        {
            label: decodedBranch,
            href: `/programs/${programId}/branches/${branchName}`,
        },
        {
            label: "PYQs",
        },
    ]


    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <BackButton
                to={`/programs/${programId}/branches/${branchName}`}
                label={decodedBranch}
            />

            <Breadcrumbs items={breadcrumbItems} />

            <div>
                <h1 className="text-2xl font-bold">PYQs</h1>
                <p className="text-muted-foreground mt-1">
                    {decodeURIComponent(branchName)}
                </p>
            </div>

            {loadingSemesters || loadingProgram ? (
                <p className="text-muted-foreground">Loading semesters...</p>
            ) : semesters.length === 0 ? (
                <p className="text-muted-foreground">
                    No PYQs available yet.
                </p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {semesters.map((sem) => (
                        <GlowCard
                            key={sem}
                            className="cursor-pointer relative"
                            onClick={() =>
                                navigate(
                                    `/programs/${programId}/branches/${branchName}/pyqs/semester/${sem}`
                                )
                            }
                        >
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Semester {sem}
                                </CardTitle>

                                <CardDescription>
                                    View PYQs
                                </CardDescription>
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

export default PyqUserView
