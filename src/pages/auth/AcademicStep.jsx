import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"

import { getUniversities } from "@/services/universityService"
import { getProgramsByUniversity } from "@/services/programService"
import { getBranchesByProgram } from "@/services/branchService"

const AcademicStep = ({ data, setData, onNext, onBack }) => {
    const [universities, setUniversities] = useState([])
    const [programs, setPrograms] = useState([])
    const [branches, setBranches] = useState([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    /* ---------------- Load Universities ---------------- */
    useEffect(() => {
        const loadUniversities = async () => {
            try {
                const res = await getUniversities()
                setUniversities(res || [])
            } catch (err) {
                console.error("Failed to load universities", err)
                setUniversities([])
            }
        }

        loadUniversities()
    }, [])

    /* ---------------- Load Programs ---------------- */
    useEffect(() => {
        if (!data.universityId) {
            setPrograms([])
            return
        }

        const loadPrograms = async () => {
            const res = await getProgramsByUniversity(data.universityId)
            setPrograms(res || [])
        }

        loadPrograms()

        // Reset dependent fields
        setData(prev => ({
            ...prev,
            programId: "",
            branchId: ""
        }))
    }, [data.universityId])

    /* ---------------- Load Branches ---------------- */
    useEffect(() => {
        if (!data.programId) {
            setBranches([])
            return
        }

        const loadBranches = async () => {
            const res = await getBranchesByProgram(data.programId)
            setBranches(res || [])
        }

        loadBranches()

        // Reset branch when program changes
        setData(prev => ({
            ...prev,
            branchId: ""
        }))
    }, [data.programId])

    /* ---------------- Submit (NO DB CALL HERE) ---------------- */
    const handleSubmit = () => {
        if (!data.universityId || !data.programId || !data.branchId) {
            setError("Please select all fields")
            return
        }

        onNext()
    }

    return (
        <div className="space-y-6">

            <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Academic Details
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                    Help us personalize your experience
                </p>
            </div>

            {/* University */}
            <div className="space-y-2">
                <Label>University</Label>
                <Select
                    value={data.universityId || ""}
                    onValueChange={(val) =>
                        setData(prev => ({
                            ...prev,
                            universityId: val
                        }))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select University" />
                    </SelectTrigger>
                    <SelectContent>
                        {universities.map((u) => (
                            <SelectItem key={u.$id} value={u.$id}>
                                {u.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Program */}
            <div className="space-y-2">
                <Label>Program</Label>
                <Select
                    value={data.programId || ""}
                    onValueChange={(val) =>
                        setData(prev => ({
                            ...prev,
                            programId: val
                        }))
                    }
                    disabled={!data.universityId}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent>
                        {programs.map((p) => (
                            <SelectItem key={p.$id} value={p.$id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Branch */}
            <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                    value={data.branchId || ""}
                    onValueChange={(val) =>
                        setData(prev => ({
                            ...prev,
                            branchId: val
                        }))
                    }
                    disabled={!data.programId}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                        {branches.map((b) => (
                            <SelectItem key={b.$id} value={b.$id}>
                                {b.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div className="flex justify-between gap-4">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>

                <Button onClick={handleSubmit} disabled={loading}>
                    Continue
                </Button>
            </div>
        </div>
    )
}

export default AcademicStep
