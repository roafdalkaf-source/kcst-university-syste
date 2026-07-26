export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
        </div>
        <p className="text-sm text-gray-500 animate-pulse">جاري التحميل...</p>
      </div>
    </div>
  );
}
