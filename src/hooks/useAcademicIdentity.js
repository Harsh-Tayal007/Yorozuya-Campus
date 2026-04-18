import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

import { getUniversityById } from "@/services/university/universityService";
import { getProgramById } from "@/services/university/programService";
import { getBranchById } from "@/services/university/branchService";

export const useAcademicIdentity = () => {
  const { user } = useAuth();

  const isTeacher = user?.accountType === "teacher" || user?.role === "teacher";

  const universityId = user?.universityId;
  const programId = user?.programId;
  const branchId = user?.branchId;

  const query = useQuery({
    queryKey: ["academic-identity", universityId, programId, branchId, isTeacher],
    queryFn: async () => {
      if (!universityId) {
        throw new Error("Academic identity incomplete");
      }

      if (isTeacher) {
        const university = await getUniversityById(universityId);
        return { university, program: null, branch: null };
      }

      if (!programId || !branchId) {
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
    enabled: isTeacher ? !!universityId : (!!universityId && !!programId && !!branchId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return query;
};
