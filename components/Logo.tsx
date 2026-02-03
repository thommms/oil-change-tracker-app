import Image from "next/image"

export default function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizes = {
    small: { height: 58 },
    default: { height: 80 },
    large: { height: 106 }
  }
  
  const height = sizes[size].height
  
  return (
    <div className="flex items-center">
      <Image 
        src="/motorsync.png" 
        alt="MotorSync Logo" 
        width={height * 3.5}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  )
}
