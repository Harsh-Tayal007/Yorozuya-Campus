import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"

import { getUniversities } from "@/services/universityService"
import { getProgramsByUniversity } from "@/services/programService"
import { getBranchesByProgram } from "@/services/branchService"
import { useNavigate } from "react-router-dom"
import SelectField from "@/components/ui/SelectField"
import { motion } from "framer-motion"


const DashboardSettings = () => {
    const queryClient = useQueryClient()
    const { user, completeAcademicProfile } = useAuth()

    const [universityId, setUniversityId] = useState(user?.universityId || "")
    const [programId, setProgramId] = useState(user?.programId || "")
    const [branchId, setBranchId] = useState(user?.branchId || "")

    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    const navigate = useNavigate()



    // 🏫 Universities
    const { data: universities = [] } = useQuery({
        queryKey: ["universities"],
        queryFn: getUniversities,
    })

    // 🎓 Programs
    const { data: programs = [] } = useQuery({
        queryKey: ["programs", universityId],
        queryFn: () => getProgramsByUniversity(universityId),
        enabled: !!universityId,
    })

    // 🌿 Branches
    const { data: branches = [] } = useQuery({
        queryKey: ["branches", programId],
        queryFn: () => getBranchesByProgram(programId),
        enabled: !!programId,
    })

    // Reset cascading
    useEffect(() => {
        setProgramId("")
        setBranchId("")
    }, [universityId])

    useEffect(() => {
        setBranchId("")
    }, [programId])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!universityId || !programId || !branchId) return

        try {
            setSaving(true)

            await completeAcademicProfile({
                universityId,
                programId,
                branchId,
            })

            await queryClient.invalidateQueries({
                queryKey: ["academic-identity"],
            })

            // Optional small delay for UX smoothness
            setTimeout(() => {
                navigate("/dashboard")
            }, 700)

            setSuccess(true)

        } catch (error) {
            console.error("Update failed:", error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="pt-6 max-w-md space-y-6">
            <h2 className="text-xl font-semibold">
                Academic Preferences
            </h2>

            {success && (
                <p className="text-green-500 text-sm">
                    Preferences updated successfully!
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* University */}
                <div className="space-y-1">
                    <SelectField
                        label="University"
                        value={universityId}
                        onChange={setUniversityId}
                        options={universities.map((u) => ({
                            value: u.$id,
                            label: u.name,
                        }))}
                        placeholder="Select University"
                    />

                </div>

                {/* Program */}
                <div className="space-y-1">
                    <SelectField
                        label="Program"
                        value={programId}
                        onChange={setProgramId}
                        options={programs.map((p) => ({
                            value: p.$id,
                            label: p.name,
                        }))}
                        disabled={!universityId}
                        placeholder="Select Program"
                    />
                </div>

                {/* Branch */}
                <div className="space-y-1">
                    <SelectField
                        label="Branch"
                        value={branchId}
                        onChange={setBranchId}
                        options={branches.map((b) => ({
                            value: b.$id,
                            label: b.name,
                        }))}
                        disabled={!programId}
                        placeholder="Select Branch"
                    />
                </div>

                <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="
    w-full
    inline-flex
    items-center
    justify-center
    gap-2
    rounded-xl
    bg-primary
    px-6
    py-2.5
    font-medium
    text-primary-foreground
    shadow-md
    disabled:opacity-50
    disabled:cursor-not-allowed
    cursor-pointer
  "
                >
                    {saving ? (
                        <>
                            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            Saving...
                        </>
                    ) : (
                        "Save Preferences"
                    )}
                </motion.button>

            </form>
        </div>
    )
}

export default DashboardSettings
