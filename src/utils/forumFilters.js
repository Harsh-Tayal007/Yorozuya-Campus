export const filterThreads = ({
  threads,
  tab,
  universityId,
  courseId,
  branchId,
  searchQuery,
}) => {
  return threads.filter((thread) => {
    // Tab filtering
    if (tab === "university" && thread.universityId !== universityId) {
      return false
    }

    if (
      tab === "course" &&
      (thread.universityId !== universityId ||
        thread.courseId !== courseId)
    ) {
      return false
    }

    if (
      tab === "branch" &&
      (thread.universityId !== universityId ||
        thread.courseId !== courseId ||
        thread.branchId !== branchId)
    ) {
      return false
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase()

      const matches =
        thread.title.toLowerCase().includes(query) ||
        thread.content.toLowerCase().includes(query) ||
        thread.author.toLowerCase().includes(query)

      if (!matches) return false
    }

    return true
  })
}