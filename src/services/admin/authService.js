import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID  = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_TABLE_ID = "users";

/**
 * Login user
 */
export const loginUser = async ({ email, password }) => {
  return await account.createEmailPasswordSession(email, password);
};

/**
 * Signup user (Auth only – DB profile handled in AuthContext)
 */
export const signupUser = async ({ email, password, name }) => {
  return await account.create(ID.unique(), email, password, name);
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  return await account.deleteSession("current");
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = async () => {
  return await account.get();
};

/**
 * Resolve a login identifier (email or username) to an email address.
 * If the identifier contains "@" it's treated as an email and returned as-is.
 * Otherwise it's looked up as a username in the users collection.
 */
export const resolveLoginEmail = async (identifier) => {
  const trimmed = identifier.trim()
  if (trimmed.includes("@")) return trimmed

  const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
    Query.equal("username", trimmed.toLowerCase()),
  ])

  if (res.total === 0) throw new Error("No account found with that username.")
  return res.documents[0].email
}

/**
 * Helper to normalize username (legacy – kept for compatibility)
 */
export const resolveUsername = (acc) => {
  return (
    acc?.prefs?.username ||
    acc?.name ||
    acc?.email?.split("@")[0] ||
    "user"
  )
}

/**
 * Check whether a username is available in the DB.
 */
export const isUsernameAvailable = async (username) => {
  const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
    Query.equal("username", username),
  ])
  return res.total === 0
}

// ── Reddit-style username generator ──────────────────────────────────────────

const adjectives = [
  // original
  "ashamed", "silent", "brave", "lazy", "curious", "dark", "bright", "hollow",
  "ancient", "bitter", "clever", "dizzy", "frosty", "gentle", "heavy", "icy",
  "jolly", "keen", "lofty", "misty", "noble", "odd", "proud", "quirky",
  "rapid", "shiny", "tiny", "unique", "vivid", "wild", "young", "zealous",
  "amber", "broken", "crimson", "damp", "empty", "fierce", "gloomy", "hasty",
  "idle", "jumpy", "known", "lunar", "merry", "nasty", "oaken", "pastel",
  "quiet", "rusty", "salty", "tame", "urban", "vague", "weary", "xeric",
  "golden", "silver", "cosmic", "sleepy", "fancy", "velvet", "stormy", "frosted",
  "digital", "electric", "painted", "burning", "frozen", "flying", "hidden",

  // anime-inspired adjectives (from character traits/names)
  "gojo", "itachi", "gintoki", "zoro", "reigen", "senku", "lelouch",
  "sakata", "kamina", "alucard", "griffith", "mugen", "vash", "spike",
  "lloyd", "sukuna", "killua", "ryomen", "levi", "guts", "izuku",
  "saiki", "ainz", "rimuru", "subaru", "kazuma", "aqua", "megumin",
  "saitama", "genos", "yato", "hisoka", "meruem", "netero", "gon",
]

const nouns = [
  // original
  "fox", "tiger", "panda", "eagle", "otter", "wolf", "lion", "hawk", "bear",
  "moth", "crab", "frog", "deer", "mole", "crow", "duck", "seal", "toad",
  "wren", "lynx", "bison", "cobra", "dingo", "finch", "gecko", "hippo",
  "ibis", "jackal", "koala", "lemur", "moose", "newt", "okapi", "parrot",
  "quail", "raven", "stoat", "tapir", "urial", "viper", "wombat", "yak",
  "zebu", "atlas", "bloom", "creek", "delta", "ember", "field", "grove",
  "haven", "inlet", "jungle", "knoll", "lagoon", "marsh", "nook", "oasis",
  "plain", "ridge", "shore", "trail", "vale", "woods", "comet", "dune",
  "frost", "gust", "haze", "iris", "jade", "kite", "lark", "mesa",

  // anime-inspired nouns (last names / places / objects)
  "satoru", "uchiha", "frontera", "roronoa", "arataka", "ishigami", "lamperouge",
  "gintoki", "lordgenome", "hellsing", "falconia", "jin", "trigun", "spiegel",
  "forger", "ryuk", "zoldyck", "sukuna", "ackerman", "dragonslayer", "midoriya",
  "kusuo", "gown", "tempest", "natsuki", "sato", "darkness", "explosion",
  "caped", "cyborg", "noragami", "phantom", "chimera", "hunter", "godspeed",
]

/**
 * Generate a Reddit-style username candidate: adj_noun_NNNN
 * Always 4-digit suffix for a consistent look.
 */
export const generateUsernameCandidate = () => {
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num  = Math.floor(Math.random() * 9000) + 1000  // 1000–9999
  return `${adj}_${noun}_${num}`
}

/**
 * Generate a username that is guaranteed available in the DB.
 * Tries up to 10 candidates before falling back to a timestamp.
 */
export const generateAvailableUsername = async () => {
  let attempts = 0

  while (attempts < 10) {
    const candidate = generateUsernameCandidate()
    const available = await isUsernameAvailable(candidate)
    if (available) return candidate
    attempts++
  }

  // Ultra-safe fallback
  return `user_${Date.now()}`
}