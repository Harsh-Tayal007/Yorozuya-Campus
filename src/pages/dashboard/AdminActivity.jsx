import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

import {
    DATABASE_ID,
    ACTIVITIES_COLLECTION_ID,
} from "@/config/appwrite"

import {
    Card,
    CardContent,
} from "@/components/ui/card"

export default function AdminActivity() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await databases.listDocuments(
                    DATABASE_ID,
                    ACTIVITIES_COLLECTION_ID,
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(50), // safe default
                    ]
                )

                setActivities(res.documents)
            } catch (err) {
                console.error("Failed to fetch activities", err)
            } finally {
                setLoading(false)
            }
        }

        fetchActivities()
    }, [])

    return (
        <div className="p-6 max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">Activity Log</h1>

            <Card>
                <CardContent className="p-0">
                    {loading && (
                        <p className="p-4 text-sm text-muted-foreground">
                            Loading activity…
                        </p>
                    )}

                    {!loading && activities.length === 0 && (
                        <p className="p-4 text-sm text-muted-foreground">
                            No activity recorded yet
                        </p>
                    )}

                    {!loading && activities.length > 0 && (
                        <div className="divide-y">
                            {activities.map((activity) => {
                                const time = new Date(activity.$createdAt)

                                return (
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
                                            {activity.entityName && (
                                                <>“{activity.entityName}”</>
                                            )}
                                        </p>

                                        <p className="text-xs text-muted-foreground mt-1">
                                            {time.toLocaleDateString()} •{" "}
                                            {time.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
