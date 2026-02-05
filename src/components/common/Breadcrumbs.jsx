import { Link } from "react-router-dom"

const Breadcrumbs = ({ items }) => {
  return (
    <nav className="text-sm text-muted-foreground mb-4">
      <ol className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {item.href ? (
              <Link to={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <span>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
