import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil } from "lucide-react"

const ProgramCard = ({ program, onEdit, onDelete }) => {
  return (
    <Card
      className="
        relative overflow-hidden
        transition-all duration-300
        hover:shadow-lg
        before:absolute before:top-0 before:left-0
        before:h-1 before:w-0
        before:bg-violet-500
        before:transition-all before:duration-300
        hover:before:w-full
      "
    >
      {/* ACTION BUTTONS */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(program)}
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="text-destructive"
          onClick={() => onDelete?.(program.$id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-1">
        <h3 className="font-semibold leading-tight">
          {program.name}
        </h3>

        <p className="text-sm text-muted-foreground">
          {program.degreeType} ·{" "}
          {program.duration.toString().includes("year")
            ? program.duration
            : `${program.duration} years`}
        </p>
      </div>
    </Card>
  )
}

export default ProgramCard
