// src/components/DownloadPdf.jsx
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useProducts, API_BASE } from "../context/ProductProvider";
import headerLogo from "../assets/Sarjan (2).png"; // adjust path if needed

const WATERMARK_URL = "/watermark.png";

/** Create small repeating tile (dataURL) so html2canvas captures background reliably */
function createPatternDataUrl(tileSize = 52, strokeColor = "#ededed") {
  const c = document.createElement("canvas");
  c.width = tileSize;
  c.height = tileSize;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tileSize, tileSize);

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;

  // simple chevron / diamond hint
  ctx.beginPath();
  ctx.moveTo(0, tileSize * 0.5);
  ctx.lineTo(tileSize * 0.5, 0);
  ctx.lineTo(tileSize, tileSize * 0.5);
  ctx.lineTo(tileSize * 0.5, tileSize);
  ctx.closePath();
  ctx.stroke();

  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, tileSize * 0.5 + 3);
  ctx.lineTo(tileSize * 0.5 + 3, 0);
  ctx.lineTo(tileSize + 3, tileSize * 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;

  return c.toDataURL("image/png");
}

export default function DownloadPdf({
  productsToExport,
  selectedCategory,
  selectedSub,
  layout: parentLayout,
  onLayoutChange,
}) {
  const { products: allProducts, showToast } = useProducts();
  const [isGenerating, setIsGenerating] = useState(false);
  const [preset, setPreset] = useState(parentLayout || "3x3"); // synced with parent
  const [rows, setRows] = useState(preset === "4x4" ? 4 : 3);
  const [cols, setCols] = useState(preset === "4x4" ? 4 : 3);

  // keep local preset in sync if parent changes layout externally
  useEffect(() => {
    if (parentLayout && parentLayout !== preset) {
      setPreset(parentLayout);
      if (parentLayout === "3x3") {
        setRows(3);
        setCols(3);
      } else if (parentLayout === "4x4") {
        setRows(4);
        setCols(4);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentLayout]);

  const effectiveProducts = productsToExport ?? allProducts;
  const computeItemsPerPage = () =>
    preset === "3x3" ? 9 : preset === "4x4" ? 16 : Number(rows) * Number(cols) || 9;

  const resolveImageUrl = (url) => {
    if (!url) return url;
    if (url.startsWith("/uploads")) {
      const serverOrigin = API_BASE.replace(/\/api$/, "");
      return `${serverOrigin}${url}`;
    }
    return url;
  };

  const fetchAsDataUrl = async (url) => {
    if (!url) return null;
    try {
      const resp = await fetch(url, { mode: "cors" });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      return await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("fetchAsDataUrl error:", err);
      return null;
    }
  };

  const handleDownload = async () => {
    try {
      if (!effectiveProducts || effectiveProducts.length === 0) {
        showToast?.("No products to export.", "error");
        return;
      }
      setIsGenerating(true);

      const itemsPerPage = computeItemsPerPage();
      const chunks = [];
      for (let i = 0; i < effectiveProducts.length; i += itemsPerPage) {
        chunks.push(effectiveProducts.slice(i, i + itemsPerPage));
      }

      const headerLogoSrc = resolveImageUrl(headerLogo) || headerLogo;
      const watermarkSrc = WATERMARK_URL;

      const headerLogoData = await fetchAsDataUrl(headerLogoSrc).catch(() => null);
      const watermarkData = await fetchAsDataUrl(watermarkSrc).catch(() => null);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const columns = preset === "3x3" ? 3 : preset === "4x4" ? 4 : Number(cols) || 3;

      // pattern tile to ensure background captured
      const PATTERN_TILE = 52;
      const PATTERN_COLOR = "#ededed";
      const patternDataUrl = createPatternDataUrl(PATTERN_TILE, PATTERN_COLOR);

      // how much to nudge cards below logo (tweakable)
      const CARD_NUDGE = 40;

      for (let pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
        const pageItems = chunks[pageIndex];
        if (pageIndex > 0) pdf.addPage();

        // create off-DOM wrapper that mimics Home's look (595px width)
        const wrapper = document.createElement("div");
        wrapper.style.width = "595px";
        wrapper.style.padding = "10px";
        wrapper.style.background = "#fff";
        wrapper.style.boxSizing = "border-box";
        wrapper.style.position = "fixed";
        wrapper.style.left = "-9999px";
        wrapper.style.top = "0";
        wrapper.style.zIndex = "99999";
        wrapper.style.fontFamily = "Arial, Helvetica, sans-serif";
        wrapper.style.color = "#0f3b6a";
        wrapper.style.minHeight = "1200px";
        wrapper.style.overflow = "visible";

        // background tiled pattern (as image) - ensures html2canvas captures it
        const bg = document.createElement("div");
        bg.style.position = "absolute";
        bg.style.inset = "0";
        bg.style.zIndex = "0";
        bg.style.backgroundColor = "#fff";
        bg.style.backgroundImage = `url("${patternDataUrl}")`;
        bg.style.backgroundRepeat = "repeat";
       bg.style.backgroundSize = "60px 60px"; 
        wrapper.appendChild(bg);

        // header (logo + divider)
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.flexDirection = "column";
        header.style.alignItems = "center";
        header.style.justifyContent = "center";
        header.style.margin = "0";
        header.style.padding = "0";
        header.style.boxSizing = "border-box";
        header.style.position = "relative";
        header.style.zIndex = "2";

        const mainLogo = document.createElement("img");
        mainLogo.src = headerLogoData || headerLogoSrc;
        mainLogo.alt = "Sarjan";
        mainLogo.draggable = false;
        mainLogo.style.display = "block";
        mainLogo.style.width = "520px"; // same as UI max
        mainLogo.style.maxWidth = "92%";
        mainLogo.style.height = "auto";
        mainLogo.style.lineHeight = "0";
        mainLogo.style.margin = "0 auto";
        header.appendChild(mainLogo);

        const gap = document.createElement("div");
        gap.style.height = "6px";
        header.appendChild(gap);

        const divider = document.createElement("div");
        divider.style.width = "100%";
        divider.style.height = "2px";
        divider.style.background = "#000";
        divider.style.opacity = "0.9";
        divider.style.boxSizing = "border-box";
        header.appendChild(divider);

        wrapper.appendChild(header);

        // wait for logo to render to measure height
        await new Promise((resolve) => {
          if (mainLogo.complete && mainLogo.naturalHeight > 0) return resolve();
          const t = setTimeout(resolve, 800);
          mainLogo.onload = () => {
            clearTimeout(t);
            setTimeout(resolve, 40);
          };
          mainLogo.onerror = () => {
            clearTimeout(t);
            setTimeout(resolve, 40);
          };
        });

        const logoRect = mainLogo.getBoundingClientRect();
        const actualLogoHeight = Math.round(logoRect.height || 0);

        // compute how much space before grid: logo height + small gap + nudge
        const OFFSET = actualLogoHeight + 8 + CARD_NUDGE;

        // optional category/subtitle line
        if (selectedCategory || selectedSub) {
          const catLine = document.createElement("div");
          catLine.style.textAlign = "center";
          catLine.style.marginTop = "4px";
          catLine.style.fontSize = "14px";
          catLine.style.fontWeight = "700";
          catLine.style.color = "#0f3b6a";
          catLine.style.marginBottom = "6px";
          catLine.style.position = "relative";
          catLine.style.zIndex = "2";
          catLine.textContent = (selectedCategory ? selectedCategory : "All Categories") + (selectedSub ? " • " + selectedSub : "");
          wrapper.appendChild(catLine);
        }

        // grid
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        grid.style.gap = "18px";
        grid.style.marginTop = `${OFFSET}px`;
        grid.style.padding = "0";
        grid.style.boxSizing = "border-box";
        grid.style.position = "relative";
        grid.style.zIndex = "2";

        // create product cards
        for (const p of pageItems) {
          const card = document.createElement("div");
          card.style.display = "flex";
          card.style.flexDirection = "column";
          card.style.alignItems = "center";
          card.style.position = "relative";

          const imgWrap = document.createElement("div");
          imgWrap.style.width = "100%";
          imgWrap.style.aspectRatio = "3/4";
          imgWrap.style.overflow = "hidden";
          imgWrap.style.borderRadius = "18px";
          imgWrap.style.border = "4px solid #1c3f7a";
          imgWrap.style.boxSizing = "border-box";
          imgWrap.style.background = "#fff";
          imgWrap.style.position = "relative";
          imgWrap.style.minHeight = "120px";

          const img = document.createElement("img");
          const originalUrl = p.image || "";
          const proxied = `${API_BASE}/image-proxy?url=${encodeURIComponent(originalUrl)}`;

          img.crossOrigin = "anonymous";
          img.referrerPolicy = "no-referrer";
          img.onerror = function () {
            try {
              const fallback = resolveImageUrl(p.image);
              if (fallback && fallback !== proxied) {
                img.onerror = null;
                img.src = fallback;
                return;
              }
            } catch (e) {}
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
          };
          img.src = proxied;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";
          imgWrap.appendChild(img);

          // watermark
          const wm = document.createElement("img");
          wm.alt = "wm";
          wm.style.position = "absolute";
          wm.style.bottom = "8px";
          wm.style.right = "8px";
          wm.style.opacity = "0.7";
          wm.style.width = "30%";
          wm.style.maxWidth = "110px";
          wm.style.pointerEvents = "none";
          wm.style.userSelect = "none";
          wm.src = watermarkData || watermarkSrc;
          imgWrap.appendChild(wm);

          const info = document.createElement("div");
          info.style.display = "flex";
          info.style.flexDirection = "column";
          info.style.alignItems = "center";
          info.style.justifyContent = "center";
          info.style.width = "100%";
          info.style.marginTop = "8px";
          info.style.fontSize = "11px";
          info.style.color = "#0f3b6a";
          info.style.fontWeight = "700";
          info.style.lineHeight = "1.2";
          info.style.textAlign = "center";
          info.style.minHeight = "36px";

          const line1 = document.createElement("span");
          line1.innerHTML = `Model No. <span style="font-weight:800;">${p.model}</span>`;
          const line2 = document.createElement("span");
          line2.style.marginTop = "4px";
          line2.innerHTML = `Rs.<span style="font-weight:800;">${p.price}</span>/-`;

          info.appendChild(line1);
          info.appendChild(line2);

          card.appendChild(imgWrap);
          card.appendChild(info);
          grid.appendChild(card);
        }

        wrapper.appendChild(grid);

        // footer
        const footer = document.createElement("div");
        footer.style.marginTop = "18px";
        footer.style.background = "#003b7a";
        footer.style.color = "#ffffff";
        footer.style.padding = "12px 16px";
        footer.style.fontFamily = "Arial, Helvetica, sans-serif";
        footer.style.textAlign = "center";
        footer.style.position = "relative";
        footer.style.zIndex = "2";
        footer.innerHTML = `
          <div style="display:flex; justify-content:center; gap:24px; font-size:10px; margin-bottom:4px; flex-wrap:wrap;">
            <span>🌐 www.sarjanindustries.com</span>
            <span>📞 +91 9898803407</span>
          </div>
          <div style="font-size:9px; opacity:0.95; line-height:1.1;">
            S.no. 1241/1, Village : Aghar, Ta. : Saraswati Patan Deesa State Highway Dist. : Gujarat 384285
          </div>
        `;
        wrapper.appendChild(footer);

        // append wrapper, wait images load, then capture
        document.body.appendChild(wrapper);
        await new Promise((r) => setTimeout(r, 300));

        const imgs = Array.from(wrapper.querySelectorAll("img"));
        await Promise.all(
          imgs.map(
            (image) =>
              new Promise((resolve) => {
                if (image.complete && image.naturalHeight !== 0) return resolve();
                image.onload = image.onerror = () => resolve();
                setTimeout(() => resolve(), 10000);
              })
          )
        );

        const canvas = await html2canvas(wrapper, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: null,
          imageTimeout: 20000,
        });

        const imgData = canvas.toDataURL("image/png");
        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;
        const x = (pageWidth - imgWidth) / 2;
        const y = 8;
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

        document.body.removeChild(wrapper);
      } // pages loop

      const safeCat = selectedCategory ? "-" + selectedCategory.replace(/[^a-z0-9]+/gi, "-").toLowerCase() : "";
      pdf.save(`sarjan-catalog${safeCat}.pdf`);
      showToast?.("PDF downloaded — check your Downloads folder.", "success");
    } catch (err) {
      console.error("PDF error:", err);
      showToast?.("PDF generation failed. See console for details.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // local helper variables for UI select change
  const handlePresetSelect = (v) => {
    setPreset(v);
    if (v === "3x3") {
      setRows(3);
      setCols(3);
    } else if (v === "4x4") {
      setRows(4);
      setCols(4);
    }
    if (typeof onLayoutChange === "function") onLayoutChange(v);
  };

  return (
    <>
      {isGenerating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white rounded-xl px-6 py-4 shadow-xl">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-700">Generating PDF…</p>
          </div>
        </div>
      )}

      <div className="w-full bg-white/95 rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Layout</span>
          <select
            value={preset}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="3x3">3 × 3 (9 / page)</option>
            <option value="4x4">4 × 4 (16 / page)</option>
            <option value="custom">Custom</option>
          </select>

          {preset === "custom" && (
            <>
              <input type="number" min="1" value={rows} onChange={(e) => setRows(Number(e.target.value))} className="w-16 px-2 py-1.5 border rounded-lg text-sm" placeholder="rows" />
              <span className="text-sm text-gray-500">×</span>
              <input type="number" min="1" value={cols} onChange={(e) => setCols(Number(e.target.value))} className="w-16 px-2 py-1.5 border rounded-lg text-sm" placeholder="cols" />
            </>
          )}
        </div>

        <button onClick={handleDownload} disabled={isGenerating} className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition ${isGenerating ? "bg-blue-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
          {isGenerating ? "Generating..." : `Download Catalog PDF (${computeItemsPerPage()} / page)`}
        </button>
      </div>
    </>
  );
}
