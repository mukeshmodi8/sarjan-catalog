// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useProducts } from "../context/ProductProvider";
import ProductCard from "../components/ProductCard";
import headerLogo from "../assets/Sarjan (1).png";

import DownloadPdf from "../components/DownloadPdf";

export default function Home() {
  const { loading, products, categories, filters, setFilters } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSub, setSelectedSub] = useState("");

  // LIFTED layout state (DownloadPdf receives it)
  const [layout, setLayout] = useState("3x3"); // '3x3' | '4x4' | 'custom'

  useEffect(() => {
    setSelectedCategory(filters.category || "");
    setSelectedSub(filters.subcategory || "");
  }, [filters.category, filters.subcategory]);

  const filtered = products.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedSub && p.subcategory !== selectedSub) return false;
    return true;
  });

  /***** TUNEABLE CONSTANTS (change these to tweak spacing/logo size) *****/
  // LOGO_HEIGHT: maximum rendered logo height (px) you'd like to allow
  // LOGO_BUFFER: expected space below logo before cards start (px)
  // EXTRA_OVERLAP: how much negative margin to apply (pull cards upward) (px)
  const LOGO_HEIGHT = 1100;  
  const LOGO_BUFFER = 930;    
  const EXTRA_OVERLAP = 5;  
  // derived
  const gridPaddingTop = Math.max(LOGO_HEIGHT - LOGO_BUFFER, 12); // minimum 12px
  const negativeMargin = EXTRA_OVERLAP; 
  // dynamic grid classes
  const gridColsClass = layout === "4x4" ? "grid-cols-4" : "grid-cols-3";
  const cardMaxW = layout === "4x4" ? "max-w-[140px]" : "max-w-[160px]";

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center py-5 sm:py-10 px-4">
      <div className="flex flex-col items-center w-full max-w-2xl">
        <div className="mb-4 sm:mb-8 w-full max-w-[595px] px-4 sm:px-0">
          {/* DownloadPdf को layout और setter पास कर रहे हैं ताकि page select और PDF दोनों sync रहें */}
          <DownloadPdf
            productsToExport={filtered}
            selectedCategory={selectedCategory}
            selectedSub={selectedSub}
            layout={layout}
            onLayoutChange={setLayout}
          />
        </div>

        <div className="w-full max-w-[595px] mb-4 px-4 sm:px-0">
          <div className="w-full flex flex-col sm:flex-row gap-3 items-center mb-4">
            <div className="w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCategory(value);
                  setSelectedSub("");
                  setFilters({ category: value, subcategory: "" });
                }}
                className="w-full min-w-[150px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={selectedSub}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedSub(value);
                  setFilters((prev) => ({ ...prev, subcategory: value }));
                }}
                disabled={!selectedCategory}
                className={`w-full min-w-[150px] border rounded-lg px-3 py-2 text-sm shadow-sm transition ${
                  selectedCategory ? "bg-white border-gray-300" : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <option value="">All Subcategories</option>
                {(categories.find((c) => c.name === selectedCategory)?.sub || []).map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="w-full flex items-center justify-center py-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-gray-700">Loading products — please wait</p>
              </div>
            </div>
          ) : (
            <div
              id="catalog-page-main"
              className={`w-full max-w-[595px] bg-white rounded-md shadow-2xl relative px-4 sm:px-8 pt-0 pb-24`}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #ededed 0, #ededed 1px, transparent 1px, transparent 30px), repeating-linear-gradient(-45deg, #ededed 0, #ededed 1px, transparent 1px, transparent 30px)",
                backgroundSize: "30px 30px",
              }}
            >
              {/* Absolute logo — maxHeight controlled by LOGO_HEIGHT */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-4 pointer-events-none" style={{ width: "80%", maxWidth: "520px" }}>
                <img
                  src={headerLogo}
                  alt="Sarjan Main Logo"
                  draggable={false}
                  className="select-none block"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: `${LOGO_HEIGHT}px`,
                    objectFit: "contain",
                    display: "block",
                    margin: 0,
                    padding: 0,
                    lineHeight: 0,
                  }}
                />
              </div>

              {/* Grid: paddingTop derived from constants; negativeMargin pulls grid slightly up */}
              <div
                className={`grid ${gridColsClass} gap-x-5 gap-y-6 w-full`}
                style={{
                  paddingTop: `${gridPaddingTop}px`, // derived above
                  marginTop: `-${negativeMargin}px`, // pull up a bit if you want overlap reduced
                  marginBottom: 0,
                }}
              >
                {filtered.length === 0 ? (
                  <p className="text-center text-gray-500 col-span-3">No products to show.</p>
                ) : (
                  filtered.map((p) => (
                    // Each cell is full width; inner max-w controls actual card width so layout doesn't break
                    <div key={p.id} className={`w-full flex justify-center ${cardMaxW}`}>
                      <ProductCard product={p} layout={layout} />
                    </div>
                  ))
                )}
              </div>

              {/* footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#003b7a] text-white px-6 sm:px-10 py-4 w-full">
                <div className="flex flex-col items-center text-center gap-1">
                  <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[10px] sm:text-[11px]">
                    <div className="flex items-center gap-1">
                      <span>🌐</span>
                      <span>www.sarjanindustries.com</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📞</span>
                      <span>+91 9898803407</span>
                    </div>
                  </div>
                  <div className="text-[9px] sm:text-[10px] opacity-90 leading-snug">S.no. 1241/1, Village : Aghar, Ta. : Saraswati Patan Deesa State Highway Dist. : Gujarat 384285</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
