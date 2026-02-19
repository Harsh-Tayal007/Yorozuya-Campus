import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Check } from "lucide-react"

import AccountStep from "./AccountStep"
import AcademicStep from "./AcademicStep"

import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"


const Signup = () => {
  const [step, setStep] = useState(1)
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    universityId: "",
    programId: "",
    branchId: "",
  })
  const [signupSuccess, setSignupSuccess] = useState(false)

  const steps = [1, 2, 3]

  const { completeSignup } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFinalSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      await completeSignup(signupData)
      setSignupSuccess(true)


      navigate("/dashboard") // or wherever
    } catch (err) {
      setError(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="
      relative min-h-screen flex items-center justify-center overflow-hidden px-4
      bg-gradient-to-br
      from-slate-100 via-white to-slate-200
      dark:from-[#0b1220] dark:via-[#0f1b2e] dark:to-[#0b1220]
    ">

      {/* Glow blobs */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl
        bg-blue-500/20 dark:bg-blue-600/20
        animate-pulse top-[-120px] left-[-120px]" />

      <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl
        bg-indigo-400/20 dark:bg-indigo-600/20
        animate-pulse bottom-[-120px] right-[-120px]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="
          bg-white/80 dark:bg-white/5
          backdrop-blur-xl
          border border-slate-200 dark:border-white/10
          shadow-xl dark:shadow-2xl dark:shadow-black/40
        ">
          <CardContent className="p-8">

            {/* Step Indicator */}
            <div className="flex justify-between items-center mb-8">
              {steps.map((s) => {
                const isActive = step === s
                const isCompleted = step > s

                return (
                  <div key={s} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center w-full">
                      <motion.div
                        animate={{ scale: isActive ? 1.2 : 1 }}
                        className={`
              w-10 h-10 flex items-center justify-center rounded-full
              ${isCompleted ? "bg-green-500 text-white" :
                            isActive ? "bg-blue-600 text-white" :
                              "bg-gray-400/30 text-gray-600"}
            `}
                      >
                        {isCompleted ? <Check size={18} /> : s}
                      </motion.div>
                    </div>

                    {s !== 3 && (
                      <div className="flex-1 h-1 bg-gray-300/30 mx-2" />
                    )}
                  </div>
                )
              })}
            </div>


            {/* Step Content */}
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <AccountStep
                  data={signupData}
                  setData={setSignupData}
                  onNext={() => setStep(2)}
                />
              )}

              {step === 2 && (
                <AcademicStep
                  data={signupData}
                  setData={setSignupData}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}

              {step === 3 && !signupSuccess && (
                <div className="text-center space-y-6">
                  <h2 className="text-xl font-bold">
                    Confirm & Create Account
                  </h2>

                  {error && <p className="text-red-500">{error}</p>}

                  <Button
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Creating..." : "Complete Signup"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              )}

              {step === 3 && signupSuccess && (
                <div className="text-center space-y-4">
                  <Check className="mx-auto text-green-500" size={40} />
                  <h2 className="text-xl font-bold">Account Created!</h2>
                </div>
              )}

            </motion.div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Signup
