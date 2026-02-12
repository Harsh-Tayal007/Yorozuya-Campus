import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const BackButton = ({ to, label = "Back" }) => {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(to)}
      className="
        inline-flex items-center gap-2
        text-sm text-muted-foreground
        hover:text-foreground
        transition
      "
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  )
}

export default BackButton
