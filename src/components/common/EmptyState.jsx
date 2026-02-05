const EmptyState = ({ title, description }) => {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export default EmptyState
