/**
 * Builds a clean, branded filename for resources
 */
export function buildResourceFilename(resource) {
  const safeTitle = resource.title
    .replace(/[\\/:*?"<>|]/g, "")
    .trim();

  const unitPart = resource.unit
    ? `Unit ${resource.unit.order} - `
    : "";

  return `Unizuya - ${unitPart}${safeTitle}.pdf`;
}


export const buildSyllabusFilename = ({
  subjectName,
  semester,
}) => {
  return `Unizuya_${subjectName}_Syllabus_Semester_${semester}.pdf`
}
