"use client";

import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Set the pdf.js worker source
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default function PDFSplitter() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [splitMode, setSplitMode] = useState('selected'); // 'selected', 'range', 'individual'
  const [rangeInput, setRangeInput] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const canvasRefs = useRef({});

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return;
    }
    
    setError('');
    setPdfName(file.name);
    setIsLoading(true);
    setPages([]);
    setSelectedPages([]);
    setProcessingProgress(0);
    setPdfFile(file);
    
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        try {
          const typedArray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          
          setPageCount(pdf.numPages);
          
          // Generate thumbnails
          const pagesData = [];
          
          for (let i = 1; i <= pdf.numPages; i++) {
            setProcessingProgress(Math.round((i / pdf.numPages) * 100));
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnail
            
            // Create canvas for thumbnail
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render page to canvas
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            // Convert canvas to data URL
            const thumbnail = canvas.toDataURL('image/png');
            
            pagesData.push({
              pageNum: i,
              thumbnail
            });
          }
          
          setPages(pagesData);
        } catch (err) {
          console.error(err);
          setError('Failed to load PDF: ' + err.message);
          setPdfFile(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      fileReader.onerror = (err) => {
        setError('Failed to read file: ' + err);
        setIsLoading(false);
        setPdfFile(null);
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setError('An error occurred: ' + err.message);
      setIsLoading(false);
      setPdfFile(null);
    }
  };

  // Toggle page selection
  const togglePageSelection = (pageNum) => {
    if (splitMode !== 'selected') return;
    
    setSelectedPages(prev => {
      if (prev.includes(pageNum)) {
        return prev.filter(num => num !== pageNum);
      } else {
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };

  // Select all pages
  const selectAllPages = () => {
    if (pages.length === 0) return;
    const allPageNums = pages.map(page => page.pageNum);
    setSelectedPages(allPageNums);
  };

  // Clear page selection
  const clearSelection = () => {
    setSelectedPages([]);
  };

  // Parse range input
  const parseRangeInput = () => {
    if (!rangeInput.trim()) {
      setError('Please enter a valid page range');
      return [];
    }
    
    try {
      const pageSet = new Set();
      
      // Split by comma
      const parts = rangeInput.split(',').map(part => part.trim());
      
      // Process each part
      parts.forEach(part => {
        if (part.includes('-')) {
          // It's a range
          const [start, end] = part.split('-').map(num => parseInt(num.trim(), 10));
          
          if (isNaN(start) || isNaN(end)) {
            throw new Error('Invalid range format');
          }
          
          // Ensure start <= end
          const min = Math.min(start, end);
          const max = Math.max(start, end);
          
          // Ensure within bounds
          const validMin = Math.max(1, min);
          const validMax = Math.min(pageCount, max);
          
          // Add all pages in range
          for (let i = validMin; i <= validMax; i++) {
            pageSet.add(i);
          }
        } else {
          // It's a single page
          const pageNum = parseInt(part, 10);
          
          if (isNaN(pageNum)) {
            throw new Error('Invalid page number');
          }
          
          // Add if within bounds
          if (pageNum >= 1 && pageNum <= pageCount) {
            pageSet.add(pageNum);
          }
        }
      });
      
      // Convert to sorted array
      return Array.from(pageSet).sort((a, b) => a - b);
    } catch (err) {
      setError('Error parsing range: ' + err.message);
      return [];
    }
  };

  // Split PDF
  const splitPDF = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first');
      return;
    }
    
    let pagesToExtract = [];
    
    if (splitMode === 'selected') {
      pagesToExtract = selectedPages;
      if (pagesToExtract.length === 0) {
        setError('Please select at least one page');
        return;
      }
    } else if (splitMode === 'range') {
      pagesToExtract = parseRangeInput();
      if (pagesToExtract.length === 0) {
        return; // Error already set by parseRangeInput
      }
    } else if (splitMode === 'individual') {
      // We'll handle individual page extraction differently
    }
    
    setIsLoading(true);
    setProcessingProgress(0);
    
    try {
      const fileData = await readFileAsArrayBuffer(pdfFile);
      
      if (splitMode === 'individual') {
        // Extract each page as a separate PDF
        for (let i = 1; i <= pageCount; i++) {
          setProcessingProgress(Math.round((i / pageCount) * 100));
          
          // Create a new document with just this page
          const newPdfDoc = await PDFDocument.create();
          const sourcePdfDoc = await PDFDocument.load(fileData);
          
          // Copy the page
          const [copiedPage] = await newPdfDoc.copyPages(sourcePdfDoc, [i - 1]);
          newPdfDoc.addPage(copiedPage);
          
          // Save and download
          const newPdfBytes = await newPdfDoc.save();
          downloadPDF(newPdfBytes, `${pdfName.replace('.pdf', '')}_page${i}.pdf`);
          
          // Small delay to prevent browser issues with multiple downloads
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } else {
        // Extract selected pages
        const newPdfDoc = await PDFDocument.create();
        const sourcePdfDoc = await PDFDocument.load(fileData);
        
        for (let i = 0; i < pagesToExtract.length; i++) {
          setProcessingProgress(Math.round((i / pagesToExtract.length) * 100));
          
          const pageIndex = pagesToExtract[i] - 1; // Convert to 0-based index
          
          // Copy the page
          const [copiedPage] = await newPdfDoc.copyPages(sourcePdfDoc, [pageIndex]);
          newPdfDoc.addPage(copiedPage);
        }
        
        // Save and download
        const newPdfBytes = await newPdfDoc.save();
        
        // Generate filename
        let outputFilename;
        if (pagesToExtract.length === 1) {
          outputFilename = `${pdfName.replace('.pdf', '')}_page${pagesToExtract[0]}.pdf`;
        } else {
          outputFilename = `${pdfName.replace('.pdf', '')}_extract.pdf`;
        }
        
        downloadPDF(newPdfBytes, outputFilename);
      }
      
      setProcessingProgress(100);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setProcessingProgress(0);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('Error splitting PDF: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to read file as array buffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper function to download PDF
  const downloadPDF = (bytes, filename) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Get selected page description text
  const getSelectionText = () => {
    if (selectedPages.length === 0) {
      return 'No pages selected';
    } else if (selectedPages.length === 1) {
      return `Page ${selectedPages[0]} selected`;
    } else if (selectedPages.length === pageCount) {
      return 'All pages selected';
    } else {
      return `${selectedPages.length} pages selected`;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        PDF Splitter
      </h1>
      
      <div className="mb-6">
        <label className="block mb-2">
          <span className="text-gray-700 dark:text-gray-200">Select a PDF file:</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </label>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="mb-6">
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {processingProgress}%
            </span>
          </div>
          <p className="text-center mt-2 text-gray-600 dark:text-gray-400">
            {processingProgress < 50 ? 'Loading PDF pages...' : 'Processing PDF...'}
          </p>
        </div>
      )}
      
      {pdfFile && !isLoading && (
        <>
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">
              Splitting Options for {pdfName} ({pageCount} {pageCount === 1 ? 'page' : 'pages'})
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3 mb-3">
                  <input
                    type="radio"
                    value="selected"
                    checked={splitMode === 'selected'}
                    onChange={() => setSplitMode('selected')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Extract selected pages</span>
                </label>
                
                {splitMode === 'selected' && (
                  <div className="flex space-x-2 ml-7">
                    <button
                      onClick={selectAllPages}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                    >
                      Clear
                    </button>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      {getSelectionText()}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3 mb-3">
                  <input
                    type="radio"
                    value="range"
                    checked={splitMode === 'range'}
                    onChange={() => setSplitMode('range')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Extract range of pages</span>
                </label>
                
                {splitMode === 'range' && (
                  <div className="ml-7">
                    <input
                      type="text"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder="e.g. 1-3, 5, 7-9"
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Format: 1-5, 8, 11-13 (comma-separated page numbers and ranges)
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="individual"
                    checked={splitMode === 'individual'}
                    onChange={() => setSplitMode('individual')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Extract each page as a separate PDF</span>
                </label>
                {splitMode === 'individual' && (
                  <div className="ml-7 mt-2">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Note: This will create {pageCount} separate PDF files, one for each page.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={splitPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {splitMode === 'individual' ? 'Extract All Pages' : 'Extract Pages'}
              </button>
            </div>
          </div>
          
          {splitMode === 'selected' && (
            <div>
              <h3 className="font-medium mb-2 text-gray-800 dark:text-white">
                Select pages to extract:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {pages.map((page) => (
                  <div 
                    key={page.pageNum}
                    className={`relative border-2 rounded-lg overflow-hidden cursor-pointer ${
                      selectedPages.includes(page.pageNum) 
                        ? 'border-blue-500 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => togglePageSelection(page.pageNum)}
                  >
                    <div className="relative pt-[141%]"> {/* Aspect ratio for typical PDF */}
                      <img 
                        src={page.thumbnail} 
                        alt={`Page ${page.pageNum}`} 
                        className="absolute top-0 left-0 w-full h-full object-contain bg-white"
                      />
                    </div>
                    <div className="absolute top-1 left-1 bg-white dark:bg-gray-800 rounded px-1.5 py-0.5 text-xs font-medium">
                      {page.pageNum}
                    </div>
                    <div className="absolute top-1 right-1">
                      <input
                        type="checkbox"
                        checked={selectedPages.includes(page.pageNum)}
                        onChange={(e) => {
                          e.stopPropagation();
                          togglePageSelection(page.pageNum);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {!pdfFile && !isLoading && (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Select a PDF file to extract specific pages
          </p>
        </div>
      )}
    </div>
  );
}
