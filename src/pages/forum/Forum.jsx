// src/pages/Forum.jsx

import { useEffect, useMemo, useState } from "react"
import { universities } from "@/data/universities"

import { ThreadCard } from "@/components"
import { CreateThreadModal, ForumTabs } from "@/components/forum"
import PageWrapper from "@/components/common/layout/PageWrapper"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { filterThreads } from "@/utils/forumFilters"
import { ArrowUpDown, ChevronDown, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useQuery } from "@tanstack/react-query"
import { fetchThreads } from "@/services/forum/threadService"
import { useAuth } from "@/context/AuthContext"
import { useLocation, useNavigate } from "react-router-dom"

const Forum = () => {
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  const [sortBy, setSortBy] = useState("latest")

  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleOpenCreateThread = () => {
    if (!currentUser) {
      navigate("/login", { state: { from: location } })
      return
    }

    setIsCreateModalOpen(true)
  }

  // Debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const tabLabels = {
    all: "All",
    university: "University",
    course: "Course",
    branch: "Branch",
  }

  /* ----------------------------------
     Derived data
  -----------------------------------*/

  const derivedTab = useMemo(() => {
    if (selectedUniversity && selectedCourse && selectedBranch) {
      return "branch"
    }

    if (selectedUniversity && selectedCourse) {
      return "course"
    }

    if (selectedUniversity) {
      return "university"
    }

    return "all"
  }, [selectedUniversity, selectedCourse, selectedBranch])

  const selectedUniversityData = universities.find(
    (u) => u.id === selectedUniversity
  )

  const selectedCourseData = selectedUniversityData?.courses.find(
    (c) => c.id === selectedCourse
  )


  const canUseUniversity = Boolean(selectedUniversity)
  const canUseCourse = Boolean(selectedUniversity && selectedCourse)
  const canUseBranch =
    Boolean(selectedUniversity && selectedCourse && selectedBranch)

  const hasActiveFilters =
    selectedUniversity || selectedCourse || selectedBranch


  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })

  /* ----------------------------------
     Filtering logic
  -----------------------------------*/
  const filteredThreads = useMemo(() => {
    return filterThreads({
      threads,
      tab: derivedTab,
      universityId: selectedUniversity,
      courseId: selectedCourse,
      branchId: selectedBranch,
      searchQuery: debouncedQuery,
    })
  }, [
    threads,
    derivedTab,
    selectedUniversity,
    selectedCourse,
    selectedBranch,
    debouncedQuery,
  ])

  const sortedThreads = useMemo(() => {
    return [...filteredThreads].sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }

      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt)
      }

      if (sortBy === "replies") {
        return (b.repliesCount || 0) - (a.repliesCount || 0)
      }

      return 0
    })
  }, [filteredThreads, sortBy])

  useEffect(() => {
    if (hasActiveFilters) {
      setIsFiltersOpen(true)
    }
  }, [hasActiveFilters])

  return (
    <PageWrapper>
      {/* ================= Header ================= */}
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold">Community Forum</h1>
        <p className="text-muted-foreground">
          Discuss academics, exams, events, and campus life
        </p>
      </div>

      {/* ================= STICKY CONTROLS ================= */}
      <div className="sticky top-14 z-30">
        <div className="bg-background/80 backdrop-blur-lg border rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
          {/* Tabs */}
          <ForumTabs
            tab={derivedTab}
            canUseUniversity={canUseUniversity}
            canUseCourse={canUseCourse}
            canUseBranch={canUseBranch}
          />

          {/* Search bar */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative group flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />

              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
        pl-9 pr-9
        h-11
        rounded-xl
        transition-all duration-200
        focus-visible:ring-2
        hover:border-primary/50
        active:scale-[0.99]
      "
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="
          absolute right-3 top-1/2 -translate-y-1/2
          text-muted-foreground
          hover:text-destructive
          active:scale-90
          transition-all
        "
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                className="
        w-full sm:w-[180px]
        h-11
        rounded-xl
        transition-all
        hover:border-primary/50
        active:scale-[0.99]
      "
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="replies">Most Replies</SelectItem>
              </SelectContent>
            </Select>

            {/* post discussion */}
            <Button
              onClick={handleOpenCreateThread}
              className="h-11 rounded-xl sm:w-auto"
            >
              + Create Thread
            </Button>
            <CreateThreadModal
              open={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              derivedTab={derivedTab}
              selectedUniversity={selectedUniversity}
              selectedCourse={selectedCourse}
              selectedBranch={selectedBranch}
              selectedUniversityData={selectedUniversityData}
              selectedCourseData={selectedCourseData}
              universities={universities}
              currentUser={currentUser}
            />
          </div>

          {/* Filters */}

          <div className="space-y-3">

            {/* Mobile Toggle Button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsFiltersOpen((prev) => !prev)}
                className={`
  w-full flex items-center justify-between
  px-4 py-2 rounded-xl border
  text-sm font-medium
  transition-all duration-200

  ${hasActiveFilters
                    ? "border-primary/60 bg-primary/10 shadow-sm shadow-primary/20 animate-[pulse_3s_ease-in-out_infinite]"
                    : "bg-muted/40 hover:border-primary/40"
                  }

  active:scale-[0.98]
`}
              >
                <span>
                  Filters
                  {hasActiveFilters && (
                    <span className="
  ml-2 px-2 py-0.5
  rounded-full
  text-[10px] font-semibold
  bg-primary/20 text-primary
">
                      ({[selectedUniversity, selectedCourse, selectedBranch].filter(Boolean).length})
                    </span>
                  )}
                </span>

                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isFiltersOpen ? "rotate-180" : ""
                    }`}
                />
              </button>
            </div>

            {/* Animated Filter Content */}
            <div
              className={`
      overflow-hidden transition-all duration-300 ease-in-out
      ${isFiltersOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
      sm:max-h-none sm:opacity-100
    `}
            >

              {/* 👇 YOUR ORIGINAL FILTER CONTAINER GOES HERE 👇 */}

              <div className="rounded-xl border bg-muted/30 p-3 sm:p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* University */}
                  <Select
                    value={selectedUniversity ?? ""}
                    onValueChange={(value) => {
                      setSelectedUniversity(value)
                      setSelectedCourse(null)
                      setSelectedBranch(null)
                    }}
                  >
                    <SelectTrigger className="h-10">
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
                    <SelectTrigger className="h-10">
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
                    }}
                    disabled={!selectedCourse}
                  >
                    <SelectTrigger className="h-10">
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

                {hasActiveFilters && (
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2">
                    <p className="text-muted-foreground">
                      Viewing {tabLabels[derivedTab]} discussions
                    </p>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        setSelectedUniversity(null)
                        setSelectedCourse(null)
                        setSelectedBranch(null)
                        setIsFiltersOpen(false)
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      <div className="mt-8">

        {/* ================= Count ================= */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {sortedThreads.length} discussion
          {filteredThreads.length !== 1 && "s"}
        </p>

        {/* ================= Thread List ================= */}
        <div className="space-y-4 animate-in fade-in-50 duration-300 overflow-visible">
          {sortedThreads.length > 0 ? (
            sortedThreads.map((thread) => (
              <ThreadCard
                key={thread.$id}
                thread={thread}
                searchQuery={debouncedQuery}
              />
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                No discussions found.
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </PageWrapper>
  )
}

export default Forum
