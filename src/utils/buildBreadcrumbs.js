export const buildBreadcrumbs = (pathname, overrides = {}) => {
  const segments = pathname.split("/").filter(Boolean)

  const crumbs = []
  let accumulatedPath = ""

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    // Skip structural segments
    // 🚫 Skip structural words
  if (
    segment === "programs" ||
    segment === "branches" ||
    segment === "subject"
  ) {
    continue
  }

    accumulatedPath += `/${segment}`

    let label = overrides[segment] || segment

    if (segment === "dashboard") label = "Dashboard"
    else if (segment === "resources") label = "Resources"
    else if (segment === "syllabus") label = "Syllabus"
    else if (segment === "pyqs") label = "PYQs"
    else if (!isNaN(segment)) label = `Semester ${segment}`
    else if (segment.length > 20) continue
    else {
      label =
        segment.charAt(0).toUpperCase() +
        segment.slice(1).replace(/-/g, " ")
    }

    crumbs.push({
      label,
      href:
        i === segments.length - 1
          ? undefined
          : accumulatedPath,
    })
  }

  return crumbs
}