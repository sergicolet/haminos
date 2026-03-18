"use client"

import { useState, useRef } from "react"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import type { ProductBlock as ProductBlockType } from "@/lib/types"

interface ProductBlockProps {
  data: ProductBlockType["data"]
}

export function ProductBlock({ data }: ProductBlockProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const showNav = data.length > 1

  function scrollToCard(index: number) {
    const grid = gridRef.current
    if (!grid) return
    const card = grid.children[index] as HTMLElement
    if (card) grid.scrollTo({ left: card.offsetLeft - grid.offsetLeft, behavior: "smooth" })
    setActiveIndex(index)
  }

  function handleScroll() {
    const grid = gridRef.current
    if (!grid) return
    const cardWidth = (grid.children[0] as HTMLElement)?.offsetWidth ?? 220
    setActiveIndex(Math.min(Math.max(Math.round(grid.scrollLeft / (cardWidth + 12)), 0), data.length - 1))
  }

  return (
    <div className="relative w-full">
      {/* Prev arrow */}
      {showNav && activeIndex > 0 && (
        <button
          onClick={() => scrollToCard(activeIndex - 1)}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full bg-white shadow-md border border-zinc-100 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <IconChevronLeft className="size-4 text-black" />
        </button>
      )}
      {/* Next arrow */}
      {showNav && activeIndex < data.length - 1 && (
        <button
          onClick={() => scrollToCard(activeIndex + 1)}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full bg-white shadow-md border border-zinc-100 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <IconChevronRight className="size-4 text-black" />
        </button>
      )}

      {/* Cards */}
      <div
        ref={gridRef}
        onScroll={handleScroll}
        className="flex flex-row flex-nowrap gap-3 overflow-x-auto overflow-y-hidden py-2"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        {data.map((product, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-zinc-100 flex-shrink-0 overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
            style={{ minWidth: 220, width: 220, scrollSnapAlign: "start" }}
          >
            {/* Image */}
            <div className="h-40 bg-zinc-50 flex items-center justify-center relative overflow-hidden p-2">
              {product.img ? (
                <img
                  src={product.img}
                  alt={product.title}
                  className="w-full h-full object-contain mix-blend-multiply"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <div className="size-12 rounded-full bg-zinc-200" />
              )}
            </div>

            {/* Body */}
            <div className="p-3 flex-1 flex flex-col bg-white">
              <h4 className="text-sm font-bold text-black line-clamp-2 leading-tight mb-2 h-10">
                {product.title}
              </h4>
              <div className="text-[1.1rem] font-bold mb-2" style={{ color: "#c38692" }}>
                {product.price}
              </div>
              {product.desc && (
                <p className="text-xs text-zinc-500 line-clamp-3 mb-3 flex-1 leading-relaxed">
                  {product.desc}
                </p>
              )}
              <div className="flex flex-col gap-2 mt-auto">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block w-full text-center py-2.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors uppercase tracking-wide"
                >
                  Ver Producto
                </a>
                {product.cart && (
                  <a
                    href={product.cart}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block w-full text-center py-2.5 bg-white text-black border-2 border-black text-xs font-bold rounded-lg hover:bg-zinc-50 transition-colors uppercase tracking-wide"
                  >
                    Añadir al Carrito
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      {showNav && (
        <div className="flex justify-center gap-2 pt-1">
          {data.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToCard(i)}
              className="border-none p-0 cursor-pointer rounded-full transition-all duration-200"
              style={{
                width: 8, height: 8,
                background: i === activeIndex ? "#c38692" : "rgba(0,0,0,0.2)",
                transform: i === activeIndex ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
