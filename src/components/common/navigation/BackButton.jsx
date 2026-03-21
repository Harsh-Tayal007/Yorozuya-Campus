// src/components/common/BackButton.jsx
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const BackButton = ({ to, label = "Back" }) => {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground
                 hover:text-foreground transition-colors duration-150 group">
      <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
      {label}
    </button>
  )
}

export default BackButton