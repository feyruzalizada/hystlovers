import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} priority={index < 4} />
      ))}
    </div>
  );
}
