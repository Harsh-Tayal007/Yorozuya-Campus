import { Card } from "@/components/ui/card"

export default function LoadingCard({ count = 3 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="p-6 space-y-4 animate-pulse"
        >
          <div className="h-5 w-3/4 bg-muted rounded-md" />
          <div className="h-4 w-1/2 bg-muted rounded-md" />
        </Card>
      ))}
    </div>
  )
}
