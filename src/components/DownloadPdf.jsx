// src/components/DownloadPdf.jsx
import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function replaceImagesForCanvas(rootEl) {
  // ensure every <img> uses crossOrigin and proxy if needed
  const imgs = Array.from(rootEl.querySelectorAll("img"));
  imgs.forEach((img) => {
    // if already has proxy or same-origin, ensure crossOrigin
    img.crossOrigin = "anonymous";
    // If img.src is absolute and not same-origin, convert to proxy endpoint
    try {
      const src = img.getAttribute("src") || "";
      if (!src) return;
      const isRelative = src.startsWith("/") || src.startsWith(window.location.origin);
      const isProxy = src.includes("/api/image-proxy?url=");
      if (!isRelative && !isProxy) {
        img.src = `/api/image-proxy?url=${encodeURIComponent(src)}`;
      }
    } catch (err) {
      console.warn("replaceImagesForCanvas err", err);
    }
  });
}

export default function DownloadPdf({ containerRef, fileName = "page.pdf" }) {
  const makePdf = async () => {
    if (!containerRef?.current) return alert("No element to capture");
    const root = containerRef.current;

    // 1) replace images to proxy versions if needed
    replaceImagesForCanvas(root);

    // 2) wait briefly for browser to load proxied images
    await new Promise((r) => setTimeout(r, 400)); // small delay

    // 3) html2canvas
    const canvas = await html2canvas(root, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      logging: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
  };

  return <button onClick={makePdf}>Download PDF</button>;
}
