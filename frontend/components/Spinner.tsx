export default function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="w-12 h-12 border-4 border-t-orange-500 border-gray-200 rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
