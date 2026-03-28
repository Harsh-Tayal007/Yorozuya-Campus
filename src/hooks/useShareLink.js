// src/hooks/useShareLink.js
import { useParams } from "react-router-dom"

/**
 * Returns a function that builds the canonical public URL for the current
 * academic page, whether the component is rendered inside the dashboard or
 * the public layout.
 *
 * Usage:
 *   const getSharePath = useShareLink({ programId, branchName })
 *   // Then call with the sub-path you want to share:
 *   getSharePath("syllabus/semester/4")
 *   getSharePath("resources/semester/3/subject/abc")
 *   getSharePath("pyqs/semester/2/subject/xyz")
 *   getSharePath()   // just the branch overview
 */
export function useShareLink({ programId, branchName } = {}) {
  const params = useParams()

  // Prefer props (passed from dashboard wrappers), fall back to URL params
  const resolvedProgramId  = programId  ?? params.programId
  const resolvedBranchName = branchName ?? params.branchName

  /**
   * @param {string} [subPath] - everything after `.../branches/:branchName/`
   * @returns {string} full public path, e.g.
   *   /programs/abc/branches/Computer%20Science%20Engineering/syllabus/semester/4
   */
  function getSharePath(subPath = "") {
    if (!resolvedProgramId || !resolvedBranchName) return window.location.pathname
    const encodedBranch = encodeURIComponent(resolvedBranchName)
    const base = `/programs/${resolvedProgramId}/branches/${encodedBranch}`
    return subPath ? `${base}/${subPath}` : base
  }

  return getSharePath
}