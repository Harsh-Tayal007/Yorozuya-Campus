export const getFileIcon = (fileType) => {
  switch (fileType?.toLowerCase()) {
    case "pdf":
      return "📄"
    case "doc":
    case "docx":
      return "📝"
    case "ppt":
    case "pptx":
      return "📊"
    default:
      return "📁"
  }
}
