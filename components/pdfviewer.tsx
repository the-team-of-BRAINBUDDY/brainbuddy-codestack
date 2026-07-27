"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({
  file,
}: {
  file: File | null;
}) {
  const [pages, setPages] = useState(0);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No PDF Selected
      </div>
    );
  }

  return (
    <Document
      file={file}
      onLoadSuccess={({ numPages }) => setPages(numPages)}
    >
      {Array.from(new Array(pages), (_, index) => (
        <Page
          key={index}
          pageNumber={index + 1}
          width={500}
        />
      ))}
    </Document>
  );
}