import { Card } from "@/components/ui/card"

export default function SyllabusListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="p-4 flex flex-col md:flex-row md:items-center md:justify-between animate-pulse"
        >
          {/* Left */}
          <div className="space-y-2 w-full">
            <div className="h-4 w-1/3 bg-muted rounded-md" />
            <div className="h-3 w-1/2 bg-muted rounded-md" />
          </div>

          {/* Right buttons */}
          <div className="flex gap-2 mt-3 md:mt-0">
            <div className="h-8 w-16 bg-muted rounded-md" />
            <div className="h-8 w-20 bg-muted rounded-md" />
          </div>
        </Card>
      ))}
    </div>
  )
}
