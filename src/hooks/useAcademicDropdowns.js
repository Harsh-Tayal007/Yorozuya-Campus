// useAcademicData.js — cascading dropdown data for Forum + CreateThreadModal
import { useQuery } from "@tanstack/react-query"
import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram } from "@/services/university/branchService"

export function useUniversities() {
  return useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function usePrograms(universityId) {
  return useQuery({
    queryKey: ["programs", universityId],
    queryFn: () => getProgramsByUniversity(universityId),
    enabled: !!universityId,
    staleTime: 1000 * 60 * 30,
  })
}

export function useBranches(programId) {
  return useQuery({
    queryKey: ["branches", programId],
    queryFn: () => getBranchesByProgram(programId),
    enabled: !!programId,
    staleTime: 1000 * 60 * 30,
  })
}