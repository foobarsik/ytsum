export default function Loading() {
  return (
    <div className="shell py-12">
      <div className="skeleton mb-6 h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="skeleton h-52" />
        <div className="skeleton h-52" />
      </div>
    </div>
  );
}
