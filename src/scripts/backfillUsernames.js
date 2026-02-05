import { databases, account } from "@/lib/appwrite"
import { Query } from "appwrite"
import {
  DATABASE_ID,
} from "@/config/appwrite"
import {
  generateAvailableUsername,
} from "@/services/authService"

const USERS_TABLE_ID = "users"

export const backfillUsernames = async () => {
  const res = await databases.listDocuments(
    DATABASE_ID,
    USERS_TABLE_ID,
    [Query.isNull("username")]
  )

  console.log(`Found ${res.total} users without username`)

  for (const userDoc of res.documents) {
    const username = await generateAvailableUsername(userDoc.name)

    console.log(`Assigning ${username} → ${userDoc.email}`)

    // 1️⃣ Update users collection
    await databases.updateDocument(
      DATABASE_ID,
      USERS_TABLE_ID,
      userDoc.$id,
      { username }
    )

    // 2️⃣ Update account prefs (optional but best practice)
    try {
      const accountData = await account.get()

await account.updatePrefs({
  ...accountData.prefs,
  username,
})

    } catch (err) {
      console.warn(
        `Could not update prefs for ${userDoc.email}`,
        err.message
      )
    }
  }

  console.log("✅ Username backfill completed")
}
