import { useEffect, useRef, useState } from "react"

export function useCountUp(target, start) {
  const [count, setCount] = useState(0)
  const frameRef = useRef()
  const startTimeRef = useRef()

  useEffect(() => {
    if (!start) return

    const duration = Math.min(800, target * 60) // dynamic duration

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const progress = timestamp - startTimeRef.current
      const percentage = Math.min(progress / duration, 1)

      const current = Math.floor(percentage * target)

      setCount(current)

      if (percentage < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setCount(target) // force exact final value
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameRef.current)
  }, [target, start])

  return count
}
