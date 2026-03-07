import { useState, useRef } from "react"
import useResolvedColors from "./useResolvedColors"
import { uploadImage } from "@/lib/uploadImage"

export default function useComposeState() {

  const [text, setText] = useState("")

  const [gifOpen, setGifOpen] = useState(false)
  const [gifSearch, setGifSearch] = useState("")

  // Media previews
  const [previewGif, setPreviewGif] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  // Needed to delete image from Cloudinary
  const [uploadedImagePublicId, setUploadedImagePublicId] = useState(null)

  const [isUploading, setIsUploading] = useState(false)

  // File input ref — shared so any component can trigger it
  const fileRef = useRef(null)

  const colors = useResolvedColors()

  const canPost =
    text.trim().length > 0 ||
    !!previewGif ||
    !!previewImage

  const resetCompose = () => {
    setText("")
    setGifOpen(false)
    setGifSearch("")
    setPreviewGif(null)
    setPreviewImage(null)
    setUploadedImagePublicId(null)
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB")
      return
    }

    try {
      setIsUploading(true)

      const { url, publicId } = await uploadImage(file)

      if (previewGif) setPreviewGif(null)

      setPreviewImage(url)
      setUploadedImagePublicId(publicId)

    } catch (err) {
      console.error("Upload failed", err)
      alert("Image upload failed")
    } finally {
      setIsUploading(false)
      // Reset file input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return {
    text,
    setText,

    gifOpen,
    setGifOpen,

    gifSearch,
    setGifSearch,

    previewGif,
    setPreviewGif,

    previewImage,
    setPreviewImage,

    uploadedImagePublicId,
    setUploadedImagePublicId,

    isUploading,

    fileRef,
    handleImageSelect,

    canPost,
    resetCompose,
    colors,
  }
}
