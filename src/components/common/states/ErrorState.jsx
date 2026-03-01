import { Button } from "@/components/ui/button"

export default function ErrorState({
  message = "Something went wrong.",
  onRetry
}) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center space-y-4">
      <p className="text-destructive font-medium">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  )
}
