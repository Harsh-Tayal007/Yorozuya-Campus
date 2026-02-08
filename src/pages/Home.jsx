import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Construction } from "lucide-react"

const Home = () => {
  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-8 text-center space-y-6">

          {/* 🚧 Under Construction Alert */}
          <Alert>
            <Construction className="h-4 w-4" />
            <AlertTitle>Under Construction</AlertTitle>
            <AlertDescription>
              Unizuya is currently in active development. Some features may be
              limited or unavailable at the moment. More academic resources and
              improvements will be added in future updates.
            </AlertDescription>
          </Alert>

          {/* 👋 Heading */}
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Unizuya
          </h1>

          {/* 📘 Main description */}
          <p className="text-muted-foreground">
            Unizuya is a unified academic platform designed to help students
            easily access university resources such as previous year question
            papers (PYQs), syllabus, and study materials — all in one place.
          </p>

          {/* 🧠 Brand story */}
          <div className="rounded-lg border-l-4 border-muted bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <p className="italic">
              The name{" "}
              <span className="font-medium text-foreground">Unizuya</span> is inspired by
              the idea of <em>“Odd Jobs”</em> — a concept from Japanese pop culture where a
              single platform takes care of many different needs. In the same spirit,
              Unizuya brings together multiple academic services to make student life
              simpler and more organized.
            </p>
          </div>

          {/* 👉 CTA */}
          <div className="pt-2">
            <Link to="/universities">
              <Button size="lg">
                Browse Universities
              </Button>
            </Link>
          </div>

          {/* 🧭 Helper text */}
          <p className="text-sm text-muted-foreground">
            Start by selecting a university to explore programs, semesters,
            subjects, PYQs, and more.
          </p>

        </CardContent>
      </Card>
    </div>
  )
}

export default Home
