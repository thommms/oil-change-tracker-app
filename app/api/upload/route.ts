import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataURI = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: "motorsync/vehicles",
      resource_type: "auto",
    })

    return NextResponse.json({
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return new NextResponse("Upload failed", { status: 500 })
  }
}
