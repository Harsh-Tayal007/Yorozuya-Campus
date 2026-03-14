import { Link, useLocation } from "react-router-dom"

const Breadcrumbs = ({ items, overrides = {} }) => {
  const location = useLocation()

  if (items) {
    return (
      <nav className="text-sm text-muted-foreground mb-4">
        <ol className="flex flex-wrap gap-1 items-center">
          {items.map((crumb, i) => {
            const isLast = i === items.length - 1
            return (
              <li key={i} className="flex items-center gap-1 min-w-0">
                {isLast || !crumb.href ? (
                  <span
                    className="text-foreground font-medium truncate max-w-[140px] sm:max-w-[220px]"
                    title={crumb.label}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.href}
                    className="hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-[160px]"
                    title={crumb.label}
                  >
                    {crumb.label}
                  </Link>
                )}
                {!isLast && <span className="text-muted-foreground/50 shrink-0">/</span>}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }

  // ── Mode 2: auto-generate from URL ──────────────────────────────────────
  const segments = location.pathname.split("/").filter(Boolean)
  const breadcrumbs = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    if (segment === "programs" || segment === "branches" || segment === "subject") continue

    if (segment === "semester" && segments[i + 1]) {
      const semesterNumber = segments[i + 1]
      breadcrumbs.push({
        label: `Semester ${semesterNumber}`,
        path: "/" + segments.slice(0, i + 2).join("/"),
        isLast: i + 1 === segments.length - 1,
      })
      i++
      continue
    }

    const path = "/" + segments.slice(0, i + 1).join("/")
    const label =
      overrides[segment] ||
      decodeURIComponent(segment)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())

    breadcrumbs.push({ label, path, isLast: i === segments.length - 1 })
  }

  return (
    <nav className="text-sm text-muted-foreground mb-4">
      <ol className="flex flex-wrap gap-1 items-center">
        {breadcrumbs.map((crumb) => (
          <li key={crumb.path} className="flex items-center gap-1 min-w-0">
            {crumb.isLast ? (
              <span
                className="text-foreground font-medium truncate max-w-[140px] sm:max-w-[220px]"
                title={crumb.label}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-[160px]"
                title={crumb.label}
              >
                {crumb.label}
              </Link>
            )}
            {!crumb.isLast && <span className="text-muted-foreground/50 shrink-0">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs

export const buildBreadcrumbs = (pathname, overrides = {}) => {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs = []
  let accumulatedPath = ""

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    if (segment === "programs" || segment === "branches" || segment === "subject") continue

    accumulatedPath += `/${segment}`

    let label = overrides[segment] || segment

    if (segment === "dashboard") label = "Dashboard"
    else if (segment === "resources") label = "Resources"
    else if (segment === "syllabus") label = "Syllabus"
    else if (segment === "pyqs") label = "PYQs"
    else if (!isNaN(segment)) label = `Semester ${segment}`
    else if (segment.length > 20) continue
    else label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")

    crumbs.push({
      label,
      href: i === segments.length - 1 ? undefined : accumulatedPath,
    })
  }

  return crumbs
}