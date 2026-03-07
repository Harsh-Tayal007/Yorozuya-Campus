import { useEffect, useRef, useState } from "react"

export default function LazyGif({ gifSrc, previewSrc, alt, className, style }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
      },
      { rootMargin: "150px" }
    )

    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      <img
        src={visible ? gifSrc : previewSrc}
        alt={alt}
        className={className}
        style={style}
      />
    </div>
  )
}