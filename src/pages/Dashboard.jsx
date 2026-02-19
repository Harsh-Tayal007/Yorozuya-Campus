import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"

import { getUniversityById } from "@/services/universityService"
import { getProgramById } from "@/services/programService"
import { getBranchById } from "@/services/branchService"
import AcademicQuickAccess from "@/components/dashboard/AcademicQuickAccess"
import { useNavigate } from "react-router-dom"
import { Settings } from "lucide-react"

const Dashboard = () => {
    const { currentUser } = useAuth()
    const navigate = useNavigate()

    const [academicData, setAcademicData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchAcademicData = async () => {
            try {
                if (!currentUser) return

                const { universityId, programId, branchId } = currentUser

                const [university, program, branch] = await Promise.all([
                    getUniversityById(universityId),
                    getProgramById(programId),
                    getBranchById(branchId),
                ])

                setAcademicData({
                    university,
                    program,
                    branch,
                })
            } catch (error) {
                console.error("Dashboard academic fetch failed:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAcademicData()
    }, [currentUser])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-sm text-muted-foreground">
                    Loading your dashboard...
                </p>
            </div>
        )
    }

    if (!academicData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-sm text-red-500">
                    Failed to load academic information.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        {academicData.branch?.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {academicData.program?.name} · Branch Overview
                    </p>
                </div>

                <button
                    onClick={() => navigate("/settings/preferences")}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"

                >
                    <Settings className="h-4 w-4" />
                    Change Preferences
                </button>
            </div>


            <AcademicQuickAccess mode="dashboard" />

        </div>
    )
}

export default Dashboard
