import { BTECH_BRANCHES, MTECH_BRANCHES } from "@/constants/branches"

export const getBranchesForProgram = (programName) => {
  if (!programName) return []

  const name = programName.toLowerCase()

  if (name.includes("b.tech")) return BTECH_BRANCHES
  if (name.includes("m.tech")) return MTECH_BRANCHES

  return []
}
