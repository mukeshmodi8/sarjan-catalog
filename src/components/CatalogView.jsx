import React from "react";
import newlogo from "../assets/Sarjan1.png";
import watermark from "../assets/watermark.png";
import { useProducts } from "../context/ProductProvider";

export default function CatalogView() {
  const { products } = useProducts();

  const LOGO_HEIGHT = 260;
  const LOGO_BUFFER = 60; 
  const EXTRA_OVERLAP = 18;  
  const negativeMargin = EXTRA_OVERLAP;

  const gridPaddingTop = Math.max(LOGO_HEIGHT - LOGO_BUFFER, 12);

  return (
    <div id="catalog-page" className="sr-only">
      <div className="w-[595px] h-fit p-6 pb-20 bg-white flex flex-col items-center relative">

        {/* Absolute logo centered */}
        <div
          className="absolute left-1/2 transform -translate-x-1/2 top-4 pointer-events-none"
          style={{ width: "80%", maxWidth: "520px" }}
        >
          <img
            src={newlogo}
            alt="Sarjan Logo"
            draggable={false}
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

        {/* tiny spacer (optional) */}
        <div style={{ height: "6px" }} />

        {/* Grid: use reduced paddingTop so gap isn't huge */}
        <div
          className="grid grid-cols-3 gap-x-4 gap-y-6 place-items-center w-full"
          style={{
            paddingTop: `${gridPaddingTop}px`,
            marginTop: `-${negativeMargin}px` 
          }}
        >
          {products.map((p) => (
            <div key={p.id} className="w-[150px] flex flex-col items-center">
              <div className="rounded-[22px] overflow-hidden border-[4px] border-[#1c3f7a] bg-white shadow-md">
                <img src={watermark} alt="watermark" className="w-20 mb-0 select-none" draggable={false} style={{ display: "block", margin: 0, padding: 0 }} />
              </div>

              <div className="flex justify-between mt-1 text-[11px] text-black w-full px-1">
                <span>Model No. <span className="font-semibold">{p.model}</span></span>
                <span>Rs.<span className="font-semibold">{p.price}/-</span></span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#003b7a] text-white px-6 py-3 w-[595px]">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[11px]">
              <div className="flex items-center gap-1"><span>🌐</span><span>www.sarjanindustries.com</span></div>
              <div className="flex items-center gap-1"><span>📞</span><span>+91 9898803407</span></div>
            </div>
            <div className="text-[10px] opacity-90 leading-snug">
              S.no. 1241/1, Village : Aghar, Ta. : Saraswati Patan Deesa State Highway Dist. : Gujarat 384285
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
