"use client";

import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

// Set the pdf.js worker source
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default function PDFViewer() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageNumPending, setPageNumPending] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [fileName, setFileName] = useState('');

  // Render the page
  const renderPage = async (num) => {
    if (!pdfDoc) return;
    
    setPageRendering(true);
    
    try {
      // Get the page
      const page = await pdfDoc.getPage(num);
      
      // Get the canvas context
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set the viewport
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      setPageRendering(false);
      
      // Check if there's a pending page number
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        setPageNumPending(null);
      }
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      setPageRendering(false);
    }
  };

  // Go to previous page
  const onPrevPage = () => {
    if (pageNum <= 1) {
      return;
    }
    setPageNum(prevPageNum => prevPageNum - 1);
  };

  // Go to next page
  const onNextPage = () => {
    if (pageNum >= pageCount) {
      return;
    }
    setPageNum(prevPageNum => prevPageNum + 1);
  };

  // Change zoom level
  const onZoomChange = (newScale) => {
    setScale(newScale);
  };

  // Handle file selection
  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }
    
    setFileName(file.name);
    
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        try {
          const typedArray = new Uint8Array(this.result);
          const loadingTask = pdfjsLib.getDocument(typedArray);
          const pdf = await loadingTask.promise;
          
          setPdfDoc(pdf);
          setPageCount(pdf.numPages);
          setPageNum(1);
        } catch (error) {
          console.error("Error loading PDF:", error);
          alert('Error loading PDF. Please try again with a different file.');
        }
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      alert('Error reading the file. Please try again.');
    }
  };

  // Effect to render the page when pageNum or scale changes
  useEffect(() => {
    if (pdfDoc) {
      if (pageRendering) {
        setPageNumPending(pageNum);
      } else {
        renderPage(pageNum);
      }
    }
  }, [pageNum, scale, pdfDoc]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">PDF Viewer</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          View PDF files with zoom and page navigation controls.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Select a PDF file
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-900 dark:text-gray-300
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      dark:file:bg-blue-900 dark:file:text-blue-200
                      hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                      focus:outline-none"
          />
        </div>
        
        {pdfDoc && (
          <>
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
                <div className="flex items-center mb-4 sm:mb-0">
                  <button 
                    onClick={onPrevPage}
                    disabled={pageNum <= 1}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-l-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="px-4 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-t border-b border-gray-300 dark:border-gray-600">
                    Page {pageNum} of {pageCount}
                  </div>
                  <button 
                    onClick={onNextPage}
                    disabled={pageNum >= pageCount}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-r-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">Zoom:</span>
                  <select
                    value={scale}
                    onChange={(e) => onZoomChange(Number(e.target.value))}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0.5">50%</option>
                    <option value="0.8">80%</option>
                    <option value="1">100%</option>
                    <option value="1.2">120%</option>
                    <option value="1.5">150%</option>
                    <option value="2">200%</option>
                  </select>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                {fileName && <span>File: {fileName}</span>}
              </div>
            </div>
            
            <div className="overflow-auto bg-gray-100 dark:bg-gray-900 rounded-md p-2">
              <div className="flex justify-center">
                <canvas 
                  ref={canvasRef} 
                  className="border border-gray-300 dark:border-gray-700 shadow-sm"
                />
              </div>
            </div>
          </>
        )}
        
        {!pdfDoc && (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="mt-2">No PDF document loaded. Please select a file to view.</p>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300">How to use:</h3>
        <ul className="mt-2 list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1 text-sm">
          <li>Click "Choose File" to select a PDF from your device</li>
          <li>Navigate between pages using the Previous/Next buttons</li>
          <li>Adjust the zoom level using the dropdown menu</li>
          <li>The viewer will display one page at a time</li>
        </ul>
      </div>
    </div>
  );
}
