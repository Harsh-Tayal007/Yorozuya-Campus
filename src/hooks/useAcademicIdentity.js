import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

import { getUniversityById } from "@/services/universityService";
import { getProgramById } from "@/services/programService";
import { getBranchById } from "@/services/branchService";

export const useAcademicIdentity = () => {
  const { user } = useAuth();

  const universityId = user?.universityId;
  const programId = user?.programId;
  const branchId = user?.branchId;

  const query = useQuery({
    queryKey: ["academic-identity", universityId, programId, branchId],
    queryFn: async () => {
      if (!universityId || !programId || !branchId) {
        throw new Error("Academic identity incomplete");
      }

      const [university, program, branch] = await Promise.all([
        getUniversityById(universityId),
        getProgramById(programId),
        getBranchById(branchId),
      ]);

      return {
        university,
        program,
        branch,
      };
    },
    enabled: !!universityId && !!programId && !!branchId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return query;
};
