// src/pages/Forum.jsx

import { useState } from "react"
import { universities } from "@/data/universities"
import { threads } from "@/data/threads"

import { ThreadCard } from "@/components"
import { ForumTabs } from "@/components/forum"
import PageWrapper from "@/components/common/PageWrapper"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Forum = () => {
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [tab, setTab] = useState("all")

  /* ----------------------------------
     Derived data
  -----------------------------------*/
  const selectedUniversityData = universities.find(
    (u) => u.id === selectedUniversity
  )

  const selectedCourseData = selectedUniversityData?.courses.find(
    (c) => c.id === selectedCourse
  )

  const canUseUniversity = Boolean(selectedUniversity)
  const canUseBranch =
    Boolean(selectedUniversity && selectedCourse && selectedBranch)

  const hasActiveFilters =
    selectedUniversity || selectedCourse || selectedBranch

  /* ----------------------------------
     Filtering logic
  -----------------------------------*/
  const filteredThreads = threads.filter((thread) => {
    if (tab === "all") return true

    if (tab === "university") {
      return thread.universityId === selectedUniversity
    }

    if (tab === "branch") {
      return (
        thread.universityId === selectedUniversity &&
        thread.courseId === selectedCourse &&
        thread.branchId === selectedBranch
      )
    }

    return true
  })

  return (
    <PageWrapper>
      {/* ================= Header ================= */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Community Forum</h1>
        <p className="text-muted-foreground">
          Discuss academics, exams, events, and campus life
        </p>
      </div>

      {/* ================= STICKY CONTROLS ================= */}
      <div className="sticky top-4 z-20 space-y-4 bg-background pb-4">
        {/* Tabs */}
        <ForumTabs
          tab={tab}
          onChange={setTab}
          canUseUniversity={canUseUniversity}
          canUseBranch={canUseBranch}
        />

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* University */}
              <Select
                value={selectedUniversity ?? ""}
                onValueChange={(value) => {
                  setSelectedUniversity(value)
                  setSelectedCourse(null)
                  setSelectedBranch(null)
                  setTab("university")
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

              {/* Course */}
              <Select
                value={selectedCourse ?? ""}
                onValueChange={(value) => {
                  setSelectedCourse(value)
                  setSelectedBranch(null)
                }}
                disabled={!selectedUniversity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUniversityData?.courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Branch */}
              <Select
                value={selectedBranch ?? ""}
                onValueChange={(value) => {
                  setSelectedBranch(value)
                  setTab("branch")
                }}
                disabled={!selectedCourse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCourseData?.branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filters + reset */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Viewing {tab} discussions
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedUniversity(null)
                    setSelectedCourse(null)
                    setSelectedBranch(null)
                    setTab("all")
                  }}
                >
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================= Count ================= */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {filteredThreads.length} discussion
        {filteredThreads.length !== 1 && "s"}
      </p>

      {/* ================= Thread List ================= */}
      <div className="space-y-4 animate-in fade-in-50 duration-300 overflow-visible">
        {filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No discussions found.
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}

export default Forum
