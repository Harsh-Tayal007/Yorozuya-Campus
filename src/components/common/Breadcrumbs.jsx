import { Link, useLocation } from "react-router-dom"

const Breadcrumbs = ({ overrides = {} }) => {
  const location = useLocation()

  const segments = location.pathname
    .split("/")
    .filter(Boolean)

  const breadcrumbs = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    // 🚫 Skip structural words
  if (
    segment === "programs" ||
    segment === "branches" ||
    segment === "subject"
  ) {
    continue
  }

    // Merge semester + number
    if (segment === "semester" && segments[i + 1]) {
      const semesterNumber = segments[i + 1]

      breadcrumbs.push({
        label: `Semester ${semesterNumber}`,
        path:
          "/" + segments.slice(0, i + 2).join("/"),
        isLast: i + 1 === segments.length - 1,
      })

      i++ // skip next segment (the number)
      continue
    }

    const path = "/" + segments.slice(0, i + 1).join("/")

    const label =
      overrides[segment] ||
      decodeURIComponent(segment)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())

    breadcrumbs.push({
      label,
      path,
      isLast: i === segments.length - 1,
    })
  }

  return (
    <nav className="text-sm text-muted-foreground mb-4">
      <ol className="flex flex-wrap gap-1">
        {breadcrumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1">
            {crumb.isLast ? (
              <span className="text-foreground font-medium">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.path} className="hover:text-foreground">
                {crumb.label}
              </Link>
            )}
            {!crumb.isLast && <span>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs