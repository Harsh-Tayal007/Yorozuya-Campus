import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowUpRight } from "lucide-react"

const SemesterCard = ({ semester, onClick }) => {
    return (
        <Card
            onClick={onClick}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top

                e.currentTarget.style.setProperty("--mouse-x", `${x}px`)
                e.currentTarget.style.setProperty("--mouse-y", `${y}px`)
            }}
            className="
        relative
        cursor-pointer
        overflow-hidden
        transition-colors duration-300
        before:absolute
        before:inset-0
        before:opacity-0
        hover:before:opacity-100
        before:transition-opacity before:duration-300
        before:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.12),transparent_40%)]
        dark:before:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.08),transparent_40%)]
        hover:ring-1 hover:ring-primary/20
      "
        >
            <CardHeader>
                <CardTitle className="text-lg">
                    Semester {semester}
                </CardTitle>

                <CardDescription>
                    View syllabus
                </CardDescription>
            </CardHeader>

            <ArrowUpRight
                className="
          absolute bottom-4 right-4
          h-4 w-4
          text-muted-foreground
          opacity-70
          transition
        "
            />
        </Card>
    )
}

export default SemesterCard
