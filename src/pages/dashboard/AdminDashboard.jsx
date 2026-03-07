import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

import { useAuth } from "@/context/AuthContext"

import {
  DATABASE_ID,
  ACTIVITIES_COLLECTION_ID,
} from "@/config/appwrite"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const collections = {
  universities: "universities",
  programs: "programs",
  syllabus: "syllabus",
  units: "units",
  resources: "resources",
  pyqs: "pyqs",
}


const adminActions = [
  {
    title: "Universities",
    description: "Manage universities",
    route: "/admin/universities",
    permission: "manage:universities",
  },
  {
    title: "Programs",
    description: "Manage academic programs",
    route: "/admin/programs",
    permission: "manage:programs",
  },
  {
    title: "Syllabus",
    description: "Upload & manage syllabus",
    route: "/admin/syllabus",
    permission: "manage:syllabus", // ⚠️ see note below
  },
  {
    title: "Units",
    description: "Create & manage units",
    route: "/admin/units",
    permission: "manage:units",
  },
  {
    title: "Resources",
    description: "Upload study resources",
    route: "/admin/resources/upload",
    permission: "manage:resources",
  },
  {
    title: "PYQs",
    description: "Upload & manage previous year questions",
    route: "/admin/pyq/upload",
    permission: "manage:pyqs",
  },
]


export default function AdminDashboard() {
  const { hasPermission } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    universities: 0,
    programs: 0,
    syllabus: 0,
    units: 0,
    resources: 0,
    pyqs: 0,
  })


  const [activities, setActivities] = useState([])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          universities,
          programs,
          syllabus,
          units,
          resources,
          pyqs,
          activityLogs,
        ] = await Promise.all([
          databases.listDocuments(DATABASE_ID, collections.universities),
          databases.listDocuments(DATABASE_ID, collections.programs),
          databases.listDocuments(DATABASE_ID, collections.syllabus),
          databases.listDocuments(DATABASE_ID, collections.units),
          databases.listDocuments(DATABASE_ID, collections.resources),
          databases.listDocuments(DATABASE_ID, collections.pyqs),
          databases.listDocuments(
            DATABASE_ID,
            ACTIVITIES_COLLECTION_ID,
            [
              Query.orderDesc("$createdAt"),
              Query.limit(10),
            ]
          ),
        ])

        setStats({
          universities: universities.total,
          programs: programs.total,
          syllabus: syllabus.total,
          units: units.total,
          resources: resources.total,
          pyqs: pyqs.total,
        })


        setActivities(activityLogs.documents)
      } catch (err) {
        console.error("Dashboard load failed", err)
      }
    }

    loadDashboard()
  }, [])

  return (
    <div className="space-y-10">
      {/* 🔢 Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Universities"
          value={stats.universities}
          disabled={!hasPermission("manage:universities")}
        />
        <StatCard
          label="Programs"
          value={stats.programs}
          disabled={!hasPermission("manage:programs")}
        />
        <StatCard
          label="Syllabus"
          value={stats.syllabus}
          disabled={!hasPermission("manage:syllabus")}
        />
        <StatCard
          label="Units"
          value={stats.units}
          disabled={!hasPermission("manage:units")}
        />
        <StatCard
          label="Resources"
          value={stats.resources}
          disabled={!hasPermission("manage:resources")}
        />
        <StatCard
          label="PYQs"
          value={stats.pyqs}
          disabled={!hasPermission("view:pyqs")}
        />


      </div>

      {/* 🚀 Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((action) => {
            const allowed = hasPermission(action.permission)

            return (
              <Card
                key={action.route}
                onClick={() => allowed && navigate(action.route)}
                className={`
    group relative overflow-hidden transition-all duration-200
    ${allowed
                    ? "cursor-pointer hover:shadow-lg"
                    : "opacity-50 cursor-not-allowed"}
  `}
              >
                {/* Purple hover indicator */}
                {allowed && (
                  <span
                    className="
        absolute left-0 top-0 h-full w-1
        bg-purple-600
        scale-y-0
        origin-top
        transition-transform duration-200
        group-hover:scale-y-100
      "
                  />
                )}

                <CardHeader>
                  <CardTitle>{action.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </CardContent>
              </Card>

            )
          })}
        </div>
      </div>

      {/* 🕒 Recent Activity */}
      {hasPermission("view:activity-log") && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button
              onClick={() => navigate("/admin/activity")}
              className="text-sm text-purple-600 hover:underline"
            >
              View all →
            </button>
          </div>

          <Card>
            <CardContent className="p-0 divide-y">
              {activities.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  No recent activity
                </p>
              )}

              {activities.map((activity) => (
                <div
                  key={activity.$id}
                  className="p-4 hover:bg-muted/50 transition"
                >
                  <p className="text-sm">
                    <span className="font-medium">
                      {activity.actorName}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {activity.action}
                    </span>{" "}
                    <span className="font-medium">
                      {activity.entityType}
                    </span>{" "}
                    “{activity.entityName}”
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.$createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, disabled }) {
  return (
    <Card className={disabled ? "opacity-50" : ""}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
