export default function CheckoutLoading() {
  return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
        <p className="text-gray-500 text-sm">Loading checkout...</p>
      </div>
    </div>
  );
}
