"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the pdf.js worker source
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default function DragDropReader() {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileDetails, setFileDetails] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const canvasRef = useRef(null);
  const dropAreaRef = useRef(null);
  
  // Effect to handle drag and drop events
  useEffect(() => {
    if (!dropAreaRef.current) return;
    
    const dropArea = dropAreaRef.current;
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget === dropArea) {
        setIsDragging(false);
      }
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    };
    
    // Add event listeners
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragenter', handleDragEnter);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    
    // Clean up event listeners
    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragenter', handleDragEnter);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, [handleFile]);
  
  // Effect to render page when page number or pdf document changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pageNum, scale, pdfDoc, renderPage]);
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
    // Reset input value so the same file can be selected again
    e.target.value = null;
  };
  
  // Process the selected/dropped file
  const handleFile = useCallback((file) => {
    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setFileName(file.name);
    setPdfDoc(null);
    setPageNum(1);
    setPageCount(0);
    
    // Get file details
    const details = {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString()
    };
    setFileDetails(details);
    
    // Read the PDF file
    const fileReader = new FileReader();
    fileReader.onload = async function() {
      try {
        const typedArray = new Uint8Array(this.result);
        const loadingTask = pdfjsLib.getDocument(typedArray);
        
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setPageCount(pdf.numPages);
        
        // Render the first page
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF document: " + err.message);
        setIsLoading(false);
      }
    };
    
    fileReader.onerror = function() {
      setError("Error reading file.");
      setIsLoading(false);
    };
    
    fileReader.readAsArrayBuffer(file);
  }, [formatFileSize]);

  // Render the current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc) return;
    
    try {
      // Get the page
      const page = await pdfDoc.getPage(pageNum);
      
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
    } catch (error) {
      console.error("Error rendering page:", error);
      setError("Failed to render page: " + error.message);
    }
  }, [pdfDoc, pageNum, scale, canvasRef]);

  // Navigation functions
  const goToPrevPage = () => {
    if (pageNum > 1) {
      setPageNum(pageNum - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNum < pageCount) {
      setPageNum(pageNum + 1);
    }
  };

  const changeZoom = (delta) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    setScale(newScale);
  };

  // Format file size to human readable format
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Drag & Drop PDF Reader
      </h1>
      
      <div 
        ref={dropAreaRef}
        className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {isDragging ? 'Drop your PDF file here' : 'Drag & drop your PDF file here'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            or
          </p>
          
          <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
            <span>Select PDF File</span>
            <input
              type="file"
              onChange={handleFileInputChange}
              accept="application/pdf"
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="ml-3 text-gray-600 dark:text-gray-400">Loading PDF...</p>
        </div>
      )}
      
      {pdfDoc && !isLoading && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-medium text-gray-800 dark:text-white">{fileName}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {pageNum} of {pageCount}
                  </p>
                </div>
                
                <div className="flex items-center">
                  <button
                    onClick={() => changeZoom(-0.2)}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    title="Zoom out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </button>
                  
                  <span className="mx-2 text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(scale * 100)}%
                  </span>
                  
                  <button
                    onClick={() => changeZoom(0.2)}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    title="Zoom in"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  
                  <div className="mx-2 h-6 border-r border-gray-300 dark:border-gray-600"></div>
                  
                  <button
                    onClick={goToPrevPage}
                    disabled={pageNum <= 1}
                    className={`p-1.5 ${pageNum <= 1 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'} rounded-lg`}
                    title="Previous page"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={pageNum >= pageCount}
                    className={`p-1.5 ${pageNum >= pageCount ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'} rounded-lg`}
                    title="Next page"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 overflow-auto">
              <div className="flex justify-center">
                <canvas ref={canvasRef} className="shadow"></canvas>
              </div>
            </div>
          </div>
          
          {fileDetails && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">File Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                  <p className="text-gray-800 dark:text-white">{fileDetails.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Size:</span>
                  <p className="text-gray-800 dark:text-white">{fileDetails.size}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
                  <p className="text-gray-800 dark:text-white">{fileDetails.type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Last Modified:</span>
                  <p className="text-gray-800 dark:text-white">{fileDetails.lastModified}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
