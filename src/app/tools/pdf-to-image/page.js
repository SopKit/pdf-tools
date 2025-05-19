"use client";

import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the pdf.js worker source
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default function PDFToImage() {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPages, setSelectedPages] = useState([]);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [imageQuality, setImageQuality] = useState(1.5); // Scale factor
  const [imageFormat, setImageFormat] = useState('png'); // 'png' or 'jpeg'
  const [selectAll, setSelectAll] = useState(false);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Effect to update selected pages when selectAll changes or pages are loaded
  useEffect(() => {
    if (selectAll) {
      setSelectedPages(pages.map(page => page.pageNum));
    } else if (pages.length > 0 && selectedPages.length === 0) {
      // Auto-select first page when loading a document
      setSelectedPages([1]);
    }
  }, [selectAll, pages, selectedPages.length]);

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return;
    }
    
    setError('');
    setFileName(file.name);
    setIsLoading(true);
    setPages([]);
    setSelectedPages([]);
    setPdfDoc(null);
    setConversionProgress(0);
    
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        try {
          const typedArray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          setPdfDoc(pdf);
          
          // Generate thumbnails and page info
          const pagesData = [];
          
          for (let i = 1; i <= pdf.numPages; i++) {
            setConversionProgress(Math.round((i / pdf.numPages) * 50)); // Max 50% for thumbnails
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.2 }); // Small thumbnail
            
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
              thumbnail,
              width: page.view[2],
              height: page.view[3]
            });
          }
          
          setPages(pagesData);
          setConversionProgress(50);
        } catch (err) {
          console.error(err);
          setError('Failed to load PDF: ' + err.message);
        } finally {
          setIsLoading(false);
        }
      };
      
      fileReader.onerror = (err) => {
        setError('Failed to read file: ' + err);
        setIsLoading(false);
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setError('An error occurred: ' + err.message);
      setIsLoading(false);
    }
  };

  // Toggle page selection
  const togglePageSelection = (pageNum) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNum)) {
        return prev.filter(num => num !== pageNum);
      } else {
        return [...prev, pageNum];
      }
    });
  };

  // Toggle select all
  const handleSelectAllChange = (e) => {
    setSelectAll(e.target.checked);
  };

  // Convert selected pages to images and download
  const convertAndDownload = async () => {
    if (!pdfDoc || selectedPages.length === 0) return;
    
    setIsLoading(true);
    setConversionProgress(50); // Start at 50% since thumbnails are already done
    
    try {
      // Create hidden canvas for rendering full-size pages
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set up zip if multiple pages are selected
      let zip;
      let shouldUseZip = selectedPages.length > 1;
      
      if (shouldUseZip) {
        // For larger projects, you might want to import JSZip dynamically
        // import('jszip').then(JSZip => new JSZip.default());
        alert('Multiple page download would require a zip library like JSZip. For this demo, we\'ll download pages individually.');
        shouldUseZip = false;
      }
      
      // Process each selected page
      const outputFileName = fileName.replace('.pdf', '');
      
      for (let i = 0; i < selectedPages.length; i++) {
        const pageNum = selectedPages[i];
        const page = await pdfDoc.getPage(pageNum);
        
        // Calculate progress
        const progressIncrement = 50 / selectedPages.length;
        setConversionProgress(50 + Math.round(progressIncrement * i));
        
        // Calculate viewport for the page with desired quality scale
        const viewport = page.getViewport({ scale: imageQuality });
        
        // Set canvas dimensions to match page size
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render the page to the canvas
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;
        
        // Get the image data
        const imageFormat = 'image/png';
        const imageQualityValue = imageFormat === 'image/jpeg' ? 0.92 : undefined;
        const imageData = canvas.toDataURL(imageFormat, imageQualityValue);
        
        // Download the image
        const pageFileName = `${outputFileName}_page${pageNum}.${imageFormat === 'image/png' ? 'png' : 'jpg'}`;
        
        if (shouldUseZip) {
          // In a real implementation, this would add the image to a ZIP file
          // zip.file(pageFileName, imageData.split('base64,')[1], { base64: true });
        } else {
          // Download individual image
          const link = document.createElement('a');
          link.download = pageFileName;
          link.href = imageData;
          link.click();
          
          // Small delay to avoid browser issues with multiple downloads
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // If zip is used, generate and download zip file
      if (shouldUseZip && zip) {
        // const zipContent = await zip.generateAsync({ type: 'blob' });
        // const link = document.createElement('a');
        // link.download = `${outputFileName}_pages.zip`;
        // link.href = URL.createObjectURL(zipContent);
        // link.click();
      }
      
      setConversionProgress(100);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setConversionProgress(0);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('Error during conversion: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        PDF to Image Converter
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
                style={{ width: `${conversionProgress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {conversionProgress}%
            </span>
          </div>
          <p className="text-center mt-2 text-gray-600 dark:text-gray-400">
            {conversionProgress < 50 ? 'Loading PDF pages...' : 'Converting pages to images...'}
          </p>
        </div>
      )}
      
      {pages.length > 0 && !isLoading && (
        <>
          <div className="mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">Conversion Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Image Format:
                    <select
                      value={imageFormat}
                      onChange={(e) => setImageFormat(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="png">PNG (Lossless)</option>
                      <option value="jpeg">JPEG (Smaller Size)</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Image Quality: {imageQuality.toFixed(1)}x
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={imageQuality}
                      onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                      className="mt-1 block w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center">
              <input
                id="select-all"
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAllChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="select-all" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Select All Pages
              </label>
            </div>
            
            <button
              onClick={convertAndDownload}
              disabled={selectedPages.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Convert to {imageFormat.toUpperCase()} {selectedPages.length > 0 && `(${selectedPages.length} pages)`}
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          
          {/* Hidden canvas for rendering full-resolution pages */}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </>
      )}
      
      {!pages.length && !isLoading && (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Select a PDF file to convert its pages to images
          </p>
        </div>
      )}
    </div>
  );
}
