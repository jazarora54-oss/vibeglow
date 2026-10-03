export default function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) return <p className="flex items-center gap-2 text-sm font-semibold text-red-700"><span className="h-2.5 w-2.5 rounded-full bg-red-700" />Out of Stock</p>;
  if (stock <= 5) return <p className="flex items-center gap-2 text-sm font-semibold text-amber-700"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Only {stock} left in stock</p>;
  return <p className="flex items-center gap-2 text-sm font-semibold text-forest-500"><span className="h-2.5 w-2.5 rounded-full bg-forest-500" />In Stock</p>;
}
