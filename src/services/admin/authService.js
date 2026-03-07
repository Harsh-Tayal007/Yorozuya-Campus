import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_TABLE_ID = "users";

/**
 * Login user (UPDATED SDK METHOD)
 */
export const loginUser = async ({ email, password }) => {
  return await account.createEmailPasswordSession(email, password);
};

/**
 * Signup user
 * (Auth only – DB profile handled in AuthContext)
 */
export const signupUser = async ({ email, password, name }) => {
  return await account.create(ID.unique(), email, password, name)
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

// Add a helper to normalize username

export const resolveUsername = (account) => {
  return (
    account?.prefs?.username ||
    account?.name ||
    account?.email?.split("@")[0] ||
    "user"
  );
};

// Add username availability check helper

export const isUsernameAvailable = async (username) => {
  const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
    Query.equal("username", username),
  ]);

  return res.total === 0;
};

// Add Reddit-style username generator

const adjectives = [
  "cool",
  "silent",
  "fast",
  "curious",
  "brave",
  "lazy",
  "happy",
  "dark",
  "bright",
];

const nouns = [
  "fox",
  "tiger",
  "panda",
  "eagle",
  "otter",
  "wolf",
  "lion",
  "hawk",
  "bear",
];

const randomNumber = () => Math.floor(Math.random() * 10000);

export const generateUsernameCandidate = (name = "") => {
  const base =
    name
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 10) || "";

  if (base.length >= 3) {
    return `${base}${randomNumber()}`;
  }

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj}_${noun}_${randomNumber()}`;
};

// Generate a guaranteed-available username

export const generateAvailableUsername = async (name) => {
  let attempts = 0

  while (attempts < 10) {
    const candidate = generateUsernameCandidate(name)
    const available = await isUsernameAvailable(candidate)

    if (available) return candidate

    attempts++
  }

  // ultra-safe fallback
  return `user_${Date.now()}`
}

