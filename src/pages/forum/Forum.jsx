import { useEffect, useMemo, useRef, useState } from "react"
import { useUniversities, usePrograms, useBranches } from "@/hooks/useAcademicDropdowns"

import ThreadCard from "@/components/forum/ThreadCard"
import { CreateThreadModal, ForumTabs } from "@/components/forum"
import PageWrapper from "@/components/common/layout/PageWrapper"

import { filterThreads } from "@/utils/forumFilters"
import { ChevronDown, Plus, Search, SlidersHorizontal, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { fetchThreads } from "@/services/forum/threadService"
import { useAuth } from "@/context/AuthContext"
import { useLocation, useNavigate } from "react-router-dom"

const SORT_OPTIONS = [
  { value: "latest",  label: "Latest"       },
  { value: "oldest",  label: "Oldest"       },
  { value: "replies", label: "Most Replies" },
]

const Forum = () => {
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [selectedCourse,     setSelectedCourse]     = useState(null)
  const [selectedBranch,     setSelectedBranch]     = useState(null)
  const [searchQuery,        setSearchQuery]        = useState("")
  const [debouncedQuery,     setDebouncedQuery]     = useState("")
  const [sortBy,             setSortBy]             = useState("latest")
  const [filtersOpen,        setFiltersOpen]        = useState(false)
  const [searchOpen,         setSearchOpen]         = useState(false)
  const [isCreateModalOpen,  setIsCreateModalOpen]  = useState(false)
  const [sortOpen,           setSortOpen]           = useState(false)
  const [uniOpen,            setUniOpen]            = useState(false)
  const [courseOpen,         setCourseOpen]         = useState(false)
  const [branchOpen,         setBranchOpen]         = useState(false)

  const searchInputRef  = useRef(null)
  const sortDropdownRef   = useRef(null)
  const uniDropdownRef    = useRef(null)
  const courseDropdownRef = useRef(null)
  const branchDropdownRef = useRef(null)
  const { currentUser } = useAuth()

  // ── Real academic data from DB ──────────────────────────────────────────────
  const { data: universities = [] }                  = useUniversities()
  const { data: programs = [] }                      = usePrograms(selectedUniversity)
  const { data: branches = [] }                      = useBranches(selectedCourse)

  const navigate        = useNavigate()
  const location        = useLocation()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [searchOpen])

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e) => { if (!sortDropdownRef.current?.contains(e.target)) setSortOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [sortOpen])

  // Close filter dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!uniDropdownRef.current?.contains(e.target))    setUniOpen(false)
      if (!courseDropdownRef.current?.contains(e.target)) setCourseOpen(false)
      if (!branchDropdownRef.current?.contains(e.target)) setBranchOpen(false)
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [])

  const hasActiveFilters = !!(selectedUniversity || selectedCourse || selectedBranch)
  useEffect(() => { if (hasActiveFilters) setFiltersOpen(true) }, [hasActiveFilters])

  const derivedTab = useMemo(() => {
    if (selectedUniversity && selectedCourse && selectedBranch) return "branch"
    if (selectedUniversity && selectedCourse) return "course"
    if (selectedUniversity) return "university"
    return "all"
  }, [selectedUniversity, selectedCourse, selectedBranch])

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
    staleTime: 1000 * 60 * 5,
  })

  const filteredThreads = useMemo(() => filterThreads({
    threads, tab: derivedTab,
    universityId: selectedUniversity,
    courseId: selectedCourse,
    branchId: selectedBranch,
    searchQuery: debouncedQuery,
  }), [threads, derivedTab, selectedUniversity, selectedCourse, selectedBranch, debouncedQuery])

  const sortedThreads = useMemo(() => [...filteredThreads].sort((a, b) => {
    if (sortBy === "latest")  return new Date(b.$createdAt) - new Date(a.$createdAt)
    if (sortBy === "oldest")  return new Date(a.$createdAt) - new Date(b.$createdAt)
    if (sortBy === "replies") return (b.repliesCount ?? 0) - (a.repliesCount ?? 0)
    return 0
  }), [filteredThreads, sortBy])

  const handleCreateThread = () => {
    if (!currentUser) { navigate("/login", { state: { from: location } }); return }
    setIsCreateModalOpen(true)
  }

  const resetFilters = () => {
    setSelectedUniversity(null); setSelectedCourse(null)
    setSelectedBranch(null); setFiltersOpen(false)
  }

  const activeFilterCount = [selectedUniversity, selectedCourse, selectedBranch].filter(Boolean).length

  return (
    <PageWrapper>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Community Forum</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discuss academics, exams, events, and campus life
          </p>
        </div>
        {/* Desktop create button */}
        <button
          onClick={handleCreateThread}
          className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-xl
                     bg-primary text-primary-foreground text-sm font-semibold shrink-0
                     hover:bg-primary/90 active:scale-95 transition-all duration-150
                     shadow-sm shadow-primary/20"
        >
          <Plus size={16} /> New Thread
        </button>
      </div>

      {/* ── Sticky Controls ── */}
      <div className="sticky top-14 z-30 mb-6 overflow-visible">
        <div className="bg-background/80 backdrop-blur-lg border border-border/60
                        rounded-2xl shadow-sm overflow-visible">

          {/* Tab bar */}
          <div className="px-4 pt-3">
            <ForumTabs
              tab={derivedTab}
              canUseUniversity={!!selectedUniversity}
              canUseCourse={!!(selectedUniversity && selectedCourse)}
              canUseBranch={!!(selectedUniversity && selectedCourse && selectedBranch)}
            />
          </div>

          {/* ── Controls row ── */}
          <div className="flex items-center gap-2 px-3 py-3">

            {/* MOBILE: search icon → expands to full input */}
            {/* DESKTOP: always shown search input */}

            {/* Mobile search toggle */}
            <div className={`sm:hidden flex items-center transition-all duration-300 ease-in-out
                            ${searchOpen ? "flex-1" : "shrink-0"}`}>
              {!searchOpen ? (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-xl border border-border bg-muted/40
                             flex items-center justify-center text-muted-foreground
                             hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Search size={15} />
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                                  text-muted-foreground pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search discussions…"
                      className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border border-primary/50
                                 bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30
                                 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => { setSearchOpen(false); setSearchQuery("") }}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Desktop search — always visible */}
            {!searchOpen && (
              <div className="hidden sm:flex relative flex-1 group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                             text-muted-foreground group-focus-within:text-primary
                                             pointer-events-none transition-colors" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search discussions…"
                  className="w-full h-9 pl-9 pr-8 text-sm rounded-xl border border-border
                             bg-muted/40 placeholder:text-muted-foreground/60
                             focus:outline-none focus:ring-2 focus:ring-primary/30
                             focus:border-primary/50 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2
                               text-muted-foreground hover:text-foreground transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Sort — hidden when mobile search open */}
            {!searchOpen && (
              <div ref={sortDropdownRef} className="relative shrink-0">
                <button
                  onClick={() => setSortOpen(v => !v)}
                  className="h-9 px-3 rounded-xl border border-border bg-muted/40
                             text-sm font-medium text-muted-foreground hover:text-foreground
                             flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Sort"}</span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-40 z-[200] rounded-xl border border-border
                                  bg-background shadow-xl overflow-hidden
                                  animate-in fade-in-0 zoom-in-95 duration-100 origin-top-right">
                    {SORT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { setSortBy(o.value); setSortOpen(false) }}
                        className={`flex items-center justify-between w-full px-4 py-2.5 text-sm
                                    transition-colors hover:bg-muted text-left
                                    ${sortBy === o.value ? "text-primary font-semibold" : "text-foreground"}`}
                      >
                        {o.label}
                        {sortBy === o.value && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Filter toggle — hidden when mobile search open */}
            {!searchOpen && (
              <button
                onClick={() => setFiltersOpen(v => !v)}
                className={`h-9 px-2.5 rounded-xl border text-sm font-medium shrink-0
                            flex items-center gap-1.5 transition-all duration-200
                            ${filtersOpen || hasActiveFilters
                              ? "border-primary/60 bg-primary/10 text-primary"
                              : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                            }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground
                                   text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Expandable filters */}
          <div className={`transition-all duration-300 ease-in-out
                           ${filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}
                           grid`}>
          <div className="overflow-visible min-h-0">
            <div className="px-3 pb-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                {/* University */}
                <div ref={uniDropdownRef} className="relative">
                  <button
                    onClick={() => { setUniOpen(v => !v); setCourseOpen(false); setBranchOpen(false) }}
                    className={`w-full h-9 px-3 rounded-xl border text-sm flex items-center justify-between
                                transition-colors
                                ${selectedUniversity
                                  ? "border-primary/50 text-foreground"
                                  : "border-border text-muted-foreground"
                                } bg-muted/40 hover:border-primary/40`}
                  >
                    <span>{universities.find(u => u.$id === selectedUniversity)?.name ?? "University"}</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${uniOpen ? "rotate-180" : ""}`} />
                  </button>
                  {uniOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full z-[200] rounded-xl border border-border
                                    bg-background shadow-xl overflow-hidden
                                    animate-in fade-in-0 zoom-in-95 duration-100 origin-top-left">
                      {universities.map(u => (
                        <button key={u.$id} onClick={() => { setSelectedUniversity(u.$id); setSelectedCourse(null); setSelectedBranch(null); setUniOpen(false) }}
                          className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-muted
                                      ${selectedUniversity === u.$id ? "text-primary font-semibold" : "text-foreground"}`}>
                          {u.name}
                          {selectedUniversity === u.$id && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Course */}
                <div ref={courseDropdownRef} className="relative">
                  <button
                    onClick={() => { if (!selectedUniversity) return; setCourseOpen(v => !v); setUniOpen(false); setBranchOpen(false) }}
                    disabled={!selectedUniversity}
                    className={`w-full h-9 px-3 rounded-xl border text-sm flex items-center justify-between
                                transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                ${selectedCourse
                                  ? "border-primary/50 text-foreground"
                                  : "border-border text-muted-foreground"
                                } bg-muted/40 hover:border-primary/40`}
                  >
                    <span>{programs.find(p => p.$id === selectedCourse)?.name ?? "Course"}</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${courseOpen ? "rotate-180" : ""}`} />
                  </button>
                  {courseOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full z-[200] rounded-xl border border-border
                                    bg-background shadow-xl overflow-hidden
                                    animate-in fade-in-0 zoom-in-95 duration-100 origin-top-left">
                      {programs.map(p => (
                        <button key={p.$id} onClick={() => { setSelectedCourse(p.$id); setSelectedBranch(null); setCourseOpen(false) }}
                          className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-muted
                                      ${selectedCourse === p.$id ? "text-primary font-semibold" : "text-foreground"}`}>
                          {p.name}
                          {selectedCourse === p.$id && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Branch */}
                <div ref={branchDropdownRef} className="relative">
                  <button
                    onClick={() => { if (!selectedCourse) return; setBranchOpen(v => !v); setUniOpen(false); setCourseOpen(false) }}
                    disabled={!selectedCourse}
                    className={`w-full h-9 px-3 rounded-xl border text-sm flex items-center justify-between
                                transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                ${selectedBranch
                                  ? "border-primary/50 text-foreground"
                                  : "border-border text-muted-foreground"
                                } bg-muted/40 hover:border-primary/40`}
                  >
                    <span>{branches.find(b => b.$id === selectedBranch)?.name ?? "Branch"}</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${branchOpen ? "rotate-180" : ""}`} />
                  </button>
                  {branchOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full z-[200] rounded-xl border border-border
                                    bg-background shadow-xl overflow-hidden
                                    animate-in fade-in-0 zoom-in-95 duration-100 origin-top-left">
                      {branches.map(b => (
                        <button key={b.$id} onClick={() => { setSelectedBranch(b.$id); setBranchOpen(false) }}
                          className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-muted
                                      ${selectedBranch === b.$id ? "text-primary font-semibold" : "text-foreground"}`}>
                          {b.name}
                          {selectedBranch === b.$id && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground capitalize">Viewing {derivedTab} discussions</p>
                  <button onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <X size={11} /> Reset
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ── Thread list ── */}
      <div className="space-y-2.5 pb-24 sm:pb-6">
        <p className="text-xs text-muted-foreground px-1">
          {isLoading ? "Loading…" : `${sortedThreads.length} discussion${sortedThreads.length !== 1 ? "s" : ""}`}
        </p>

        {isLoading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card px-5 py-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2.5 pt-0.5">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedThreads.length > 0 ? (
          <div className="space-y-2.5">
            {sortedThreads.map(thread => (
              <ThreadCard key={thread.$id} thread={thread} searchQuery={debouncedQuery} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {debouncedQuery ? `No discussions match "${debouncedQuery}"` : "No discussions yet — start one!"}
            </p>
          </div>
        )}
      </div>

      {/* ── Mobile FAB ── */}
      <button
        onClick={handleCreateThread}
        className="sm:hidden fixed bottom-6 right-5 z-50
                   w-14 h-14 rounded-full bg-primary text-primary-foreground
                   shadow-lg shadow-primary/40
                   flex items-center justify-center
                   active:scale-90 hover:scale-105
                   transition-transform duration-150"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <CreateThreadModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        derivedTab={derivedTab}
        selectedUniversity={selectedUniversity}
        selectedCourse={selectedCourse}
        selectedBranch={selectedBranch}

        currentUser={currentUser}
      />
    </PageWrapper>
  )
}

export default Forum