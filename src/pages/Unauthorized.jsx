import { useNavigate } from "react-router-dom"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"

const Unauthorized = () => {
  const navigate = useNavigate()
  return (
    <div className="
      min-h-screen flex items-center justify-center px-4
      bg-gradient-to-br
      from-slate-100 via-white to-slate-200
      dark:from-[#0b1220] dark:via-[#0f1b2e] dark:to-[#0b1220]
    ">
      <div className="
        w-full max-w-md text-center p-8 rounded-2xl
        bg-white/80 dark:bg-white/5
        backdrop-blur-xl
        border border-slate-200 dark:border-white/10
        shadow-xl dark:shadow-2xl dark:shadow-black/40
      ">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-500/10">
            <ShieldX className="text-red-600 dark:text-red-400" size={36} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold mb-2">403</h1>
        <p className="text-lg font-semibold mb-2">
          Access Denied
        </p>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          You don’t have permission to access this page.
          If you believe this is a mistake, contact support.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>

          <Button
            onClick={() => navigate("/")}
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized