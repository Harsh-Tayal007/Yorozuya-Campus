export async function uploadImage(file) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", "forum_images")

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/df5zdmtiz/image/upload",
    { method: "POST", body: formData }
  )

  const data = await res.json()

  // Temporarily log this to check the exact publicId format
  console.log("Cloudinary upload response:", data)
  console.log("public_id:", data.public_id)

  return {
    url: data.secure_url,
    publicId: data.public_id   // This is what gets stored — verify it matches what destroy() needs
  }
}