import Link from "next/link";
export default function NotFound() {
  return (
    <div className="shell py-20 text-center">
      <h1 className="text-3xl font-bold">Playlist not found</h1>
      <p className="muted my-3">It may have been removed from this browser.</p>
      <Link href="/" className="button button-primary">
        Back to playlists
      </Link>
    </div>
  );
}
