import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DownloadPdf = () => {
  const { showToast } = useProducts();

  const handleDownload = async () => {
    const element = document.getElementById("catalog-page");

    if (!element) {
      showToast("Catalog page not found. Cannot generate PDF.", "error");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("sarjan-catalog.pdf");
    showToast(
      "PDF generation initiated. File 'sarjan-catalog.pdf' downloaded.",
      "success"
    );
  };

  return (
    <div className="flex justify-end">
      <button
        onClick={handleDownload}
        className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
      >
        <span>Download Catalog PDF</span>
      </button>
    </div>
  );
};


export default DownloadPdf;
