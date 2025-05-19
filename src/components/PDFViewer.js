'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer({ file }) {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(file);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        renderPage(1, pdf);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();
  }, [file]);

  const renderPage = async (num, doc = pdfDoc) => {
    if (!doc) return;

    try {
      const page = await doc.getPage(num);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext);
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const nextPage = () => {
    if (pageNum < numPages) {
      setPageNum(prev => prev + 1);
      renderPage(pageNum + 1);
    }
  };

  const prevPage = () => {
    if (pageNum > 1) {
      setPageNum(prev => prev - 1);
      renderPage(pageNum - 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => prev + 0.2);
    renderPage(pageNum);
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.4, prev - 0.2));
    renderPage(pageNum);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={prevPage}
          disabled={pageNum <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {pageNum} of {numPages}
        </span>
        <button
          onClick={nextPage}
          disabled={pageNum >= numPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={zoomIn}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Zoom In
        </button>
        <button
          onClick={zoomOut}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Zoom Out
        </button>
      </div>
      <canvas ref={canvasRef} className="border border-gray-300" />
    </div>
  );
}