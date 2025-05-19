"use client";

import { useState, useRef } from 'react';

export default function PDFDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('document.pdf');
  const downloadLinkRef = useRef(null);

  const handleDownload = async (e) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a valid URL');
      return;
    }
    
    // Reset state
    setLoading(true);
    setError('');
    
    try {
      // Try to fetch the PDF file
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      // Check content type to verify it's a PDF
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/pdf')) {
        throw new Error('The URL does not point to a PDF file');
      }
      
      // Get filename from Content-Disposition header or from URL
      const contentDisposition = response.headers.get('content-disposition');
      let nameFromHeader = '';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          nameFromHeader = filenameMatch[1];
        }
      }
      
      // If no filename in header, extract from URL
      if (!nameFromHeader) {
        const urlParts = url.split('/');
        let nameFromUrl = urlParts[urlParts.length - 1];
        
        // Remove query parameters if any
        nameFromUrl = nameFromUrl.split('?')[0];
        
        // If name doesn't end with .pdf, add it
        if (!nameFromUrl.toLowerCase().endsWith('.pdf')) {
          nameFromUrl = 'document.pdf';
        }
        
        nameFromHeader = nameFromUrl;
      }
      
      // Update filename state
      setFileName(nameFromHeader || 'document.pdf');
      
      // Convert response to blob
      const pdfBlob = await response.blob();
      
      // Create object URL for the blob
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a download link and trigger it
      const downloadLink = downloadLinkRef.current;
      downloadLink.href = pdfUrl;
      downloadLink.download = nameFromHeader || 'document.pdf';
      downloadLink.click();
      
      // Clean up the object URL to avoid memory leaks
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 100);
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err.message || 'Failed to download the PDF. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    const pastedUrl = e.clipboardData.getData('text');
    setUrl(pastedUrl);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">PDF Downloader</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Enter the URL of a PDF file to download it directly to your device.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <form onSubmit={handleDownload} className="space-y-4">
          <div>
            <label htmlFor="pdf-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              PDF URL
            </label>
            <div className="mt-1">
              <input
                type="url"
                id="pdf-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handlePaste}
                placeholder="https://example.com/document.pdf"
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                           focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the full URL to the PDF document you want to download.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium 
                        rounded-md shadow-sm text-white ${loading || !url 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Hidden download link */}
        <a 
          ref={downloadLinkRef} 
          style={{ display: 'none' }} 
          href="/#" 
          download={fileName}
        >
          Download
        </a>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300">How to use:</h3>
        <ul className="mt-2 list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1 text-sm">
          <li>Enter the complete URL of the PDF file you want to download</li>
          <li>Make sure the URL starts with http:// or https://</li>
          <li>Click the "Download PDF" button</li>
          <li>The download will start automatically and be saved to your browser's default download location</li>
          <li>For security reasons, some websites may block direct access to their PDF files</li>
        </ul>
      </div>
    </div>
  );
}
