import Image from "next/image";
import { Play } from "lucide-react";

export function VideoThumbnail({
  thumbnail,
  title,
  className = "",
}: {
  thumbnail: string;
  title: string;
  className?: string;
}) {
  const isImage = /^https?:\/\//.test(thumbnail);
  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-lg bg-stone-100 ${className}`}
      style={isImage ? undefined : { background: thumbnail || "#f1f5f9" }}
    >
      {isImage ? (
        <Image
          src={thumbnail}
          alt={`Preview of ${title}`}
          fill
          sizes="(max-width: 640px) 40vw, 160px"
          className="object-cover"
        />
      ) : (
        <Play size={20} className="absolute inset-0 m-auto text-stone-500" aria-hidden="true" />
      )}
    </div>
  );
}
