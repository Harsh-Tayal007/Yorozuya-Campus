import { useState, useMemo, useEffect } from "react"
import { useCreateThread } from "@/services/forum/useCreateThread"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { universities } from "@/data/universities"

export default function CreateThreadModal({
    open,
    onClose,
    derivedTab,
    selectedUniversity,
    selectedCourse,
    selectedBranch,
    selectedUniversityData,
    selectedCourseData,
    currentUser,
}) {
    const { mutate, isPending } = useCreateThread()

    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    const [localUniversity, setLocalUniversity] = useState(selectedUniversity)
    const [localCourse, setLocalCourse] = useState(selectedCourse)
    const [localBranch, setLocalBranch] = useState(selectedBranch)

    useEffect(() => {
        if (open) {
            setLocalUniversity(selectedUniversity)
            setLocalCourse(selectedCourse)
            setLocalBranch(selectedBranch)
        }
    }, [open, selectedUniversity, selectedCourse, selectedBranch])

    const canSubmit =
        title.trim() &&
        content.trim() &&
        localUniversity &&
        localCourse &&
        localBranch

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!canSubmit) return

        mutate(
            {
                title: title.trim(),
                content: content.trim(),
                universityId: localUniversity,
                courseId: localCourse,
                branchId: localBranch,
                authorId: currentUser.$id,
                authorName: currentUser.name,
            },
            {
                onSuccess: () => {
                    setTitle("")
                    setContent("")
                    onClose()
                },
            }
        )
    }

    const localUniversityData = useMemo(() => {
        return universities.find((u) => u.id === localUniversity)
    }, [universities, localUniversity])

    const localCourseData = useMemo(() => {
        return localUniversityData?.courses?.find(
            (c) => c.id === localCourse
        )
    }, [localUniversityData, localCourse])


    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Discussion</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ================= Context Section ================= */}
                    <div className="space-y-3">

                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Posting In
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {localUniversityData && (
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                    {localUniversityData.shortName}
                                </span>
                            )}

                            {localCourseData && (
                                <span className="px-3 py-1 rounded-full bg-secondary/40 text-xs font-medium">
                                    {localCourseData.name}
                                </span>
                            )}

                            {localBranch && localCourseData && (
                                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                                    {
                                        localCourseData.branches.find(
                                            (b) => b.id === localBranch
                                        )?.name
                                    }
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ================= Context Selectors ================= */}
                    {(derivedTab === "all" || derivedTab === "university" || derivedTab === "course") && (
                        <div className="space-y-4 border rounded-xl p-4 bg-muted/30">

                            {derivedTab === "all" && (
                                <Select
                                    value={localUniversity ?? ""}
                                    onValueChange={(v) => {
                                        setLocalUniversity(v)
                                        setLocalCourse(null)
                                        setLocalBranch(null)
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select University" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {universities.map((uni) => (
                                            <SelectItem key={uni.id} value={uni.id}>
                                                {uni.shortName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {(derivedTab === "all" || derivedTab === "university") && (
                                <Select
                                    value={localCourse ?? ""}
                                    onValueChange={(v) => {
                                        setLocalCourse(v)
                                        setLocalBranch(null)
                                    }}
                                    disabled={!localUniversity}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {localUniversityData?.courses?.map((course) => (
                                            <SelectItem key={course.id} value={course.id}>
                                                {course.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {(derivedTab !== "branch") && (
                                <Select
                                    value={localBranch ?? ""}
                                    onValueChange={setLocalBranch}
                                    disabled={!localCourse}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {localCourseData?.branches?.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                        </div>
                    )}

                    <div className="border-t pt-6" />

                    {/* ================= Title ================= */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Title</div>
                        <Input
                            placeholder="Be specific and clear..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* ================= Content ================= */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Discussion</div>
                        <Textarea
                            placeholder="Explain your question or topic clearly..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                        />
                    </div>

                    {/* ================= Submit ================= */}
                    <Button
                        type="submit"
                        disabled={!canSubmit || isPending}
                        className="w-full h-11 rounded-xl"
                    >
                        {isPending
                            ? "Posting..."
                            : !localUniversity || !localCourse || !localBranch
                                ? "Select context to continue"
                                : "Post Discussion"}
                    </Button>

                </form>
            </DialogContent>
        </Dialog>
    )
}