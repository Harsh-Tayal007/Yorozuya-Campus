import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { getSyllabusIdsForPyqs } from "./syllabusService";
import { getSubjectIdsWithPyqs } from "./pyqService";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SUBJECTS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_SUBJECTS_COLLECTION_ID;

export const getSubjectsForPyqSemester = async ({
  programId,
  branch,
  semester,
}) => {
  // 1. syllabus ids
  const syllabusIds = await getSyllabusIdsForPyqs({
    programId,
    semester,
  });

  if (syllabusIds.length === 0) return [];

  // 2. subjects under syllabus
  const subjectRes = await databases.listDocuments(
    DATABASE_ID,
    SUBJECTS_COLLECTION_ID,
    [Query.equal("syllabusId", syllabusIds), Query.limit(50)],
  );

  // 3. subject ids with pyqs
  const subjectIdsWithPyqs = await getSubjectIdsWithPyqs({
    programId,
    semester,
  });

  const validSubjectIdSet = new Set(subjectIdsWithPyqs);

  // 4. final filter
  return subjectRes.documents.filter((subj) => validSubjectIdSet.has(subj.$id));
};
