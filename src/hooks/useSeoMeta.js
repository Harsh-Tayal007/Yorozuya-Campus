import { useEffect } from "react"

const ensureMetaTag = (name) => {
  let metaTag = document.querySelector(`meta[name="${name}"]`)
  let created = false

  if (!metaTag) {
    metaTag = document.createElement("meta")
    metaTag.setAttribute("name", name)
    document.head.appendChild(metaTag)
    created = true
  }

  return { metaTag, created }
}

const useSeoMeta = ({ title, description }) => {
  useEffect(() => {
    const previousTitle = document.title
    const { metaTag, created } = ensureMetaTag("description")
    const previousDescription = metaTag.getAttribute("content") || ""

    if (title) {
      document.title = title
    }

    if (description) {
      metaTag.setAttribute("content", description)
    }

    return () => {
      document.title = previousTitle

      if (created) {
        metaTag.remove()
      } else {
        metaTag.setAttribute("content", previousDescription)
      }
    }
  }, [title, description])
}

export default useSeoMeta
