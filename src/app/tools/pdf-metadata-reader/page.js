"use client";

import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the pdf.js worker source
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default function PDFMetadataReader() {
  const [metadata, setMetadata] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

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
    setMetadata(null);
    
    try {
      const meta = await extractMetadata(file);
      setMetadata(meta);
    } catch (err) {
      console.error(err);
      setError('Failed to extract metadata from PDF. ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract metadata from PDF
  const extractMetadata = async (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        try {
          const typedArray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          
          // Get the metadata from the PDF document
          const pdfMetadata = await pdf.getMetadata();
          
          // Extract additional document properties
          const pageCount = pdf.numPages;
          
          // Get the first page for additional info
          const firstPage = await pdf.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1.0 });
          
          // Combine all metadata
          const combinedMetadata = {
            ...pdfMetadata.info,
            pageCount,
            fileSize: formatFileSize(file.size),
            fileName: file.name,
            pageSize: {
              width: Math.round(viewport.width * 100) / 100,
              height: Math.round(viewport.height * 100) / 100,
            },
            isEncrypted: pdfMetadata.metadata ? 
              !!pdfMetadata.metadata.get('encrypted') : false,
            documentId: pdfMetadata.metadata ? 
              pdfMetadata.metadata.get('pdfaid:part') || 'Not available' : 'Not available'
          };
          
          // Format dates
          if (combinedMetadata.CreationDate) {
            combinedMetadata.CreationDate = formatPdfDate(combinedMetadata.CreationDate);
          }
          if (combinedMetadata.ModDate) {
            combinedMetadata.ModDate = formatPdfDate(combinedMetadata.ModDate);
          }
          
          resolve(combinedMetadata);
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

  // Format PDF date string (D:YYYYMMDDHHmmSSZ format)
  const formatPdfDate = (pdfDate) => {
    if (!pdfDate || typeof pdfDate !== 'string') return 'Unknown';
    
    try {
      // Remove 'D:' prefix if present
      const dateStr = pdfDate.startsWith('D:') ? pdfDate.substring(2) : pdfDate;
      
      // Extract date components
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      
      // Extract time components if available
      let timeStr = '';
      if (dateStr.length >= 14) {
        const hour = dateStr.substring(8, 10);
        const minute = dateStr.substring(10, 12);
        const second = dateStr.substring(12, 14);
        timeStr = ` ${hour}:${minute}:${second}`;
      }
      
      return `${year}-${month}-${day}${timeStr}`;
    } catch (e) {
      console.error("Error parsing PDF date", e);
      return pdfDate; // Return original if parsing fails
    }
  };

  // Format file size to human readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate a metadata item component
  const MetadataItem = ({ label, value }) => {
    // If value is undefined, null, or empty string, display "Not available"
    const displayValue = value === undefined || value === null || value === '' 
      ? 'Not available'
      : value;
      
    return (
      <div className="flex py-3 border-b border-gray-200 dark:border-gray-700 last:border-none">
        <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">
          {label}
        </div>
        <div className="w-2/3 text-gray-900 dark:text-gray-100 break-words">
          {displayValue}
        </div>
      </div>
    );
  };

  // Copy metadata to clipboard as JSON
  const copyToClipboard = () => {
    if (!metadata) return;
    
    const metadataStr = JSON.stringify(metadata, null, 2);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(metadataStr)
        .then(() => {
          alert('Metadata copied to clipboard as JSON');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        PDF Metadata Reader
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
        <div className="flex justify-center items-center p-8">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="ml-3 text-gray-600 dark:text-gray-400">Extracting metadata...</p>
        </div>
      )}
      
      {metadata && !isLoading && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 flex justify-between items-center border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Metadata for {fileName}
            </h2>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy as JSON
            </button>
          </div>
          
          <div className="p-4 divide-y divide-gray-200 dark:divide-gray-700">
            {/* Document Info */}
            <div className="py-2">
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">Document Information</h3>
              <div className="space-y-1">
                <MetadataItem label="Title" value={metadata.Title} />
                <MetadataItem label="Author" value={metadata.Author} />
                <MetadataItem label="Subject" value={metadata.Subject} />
                <MetadataItem label="Keywords" value={metadata.Keywords} />
                <MetadataItem label="Creator" value={metadata.Creator} />
                <MetadataItem label="Producer" value={metadata.Producer} />
                <MetadataItem label="Created Date" value={metadata.CreationDate} />
                <MetadataItem label="Modified Date" value={metadata.ModDate} />
              </div>
            </div>
            
            {/* Document Properties */}
            <div className="py-2">
              <h3 className="font-bold text-gray-800 dark:text-white mt-4 mb-2">Document Properties</h3>
              <div className="space-y-1">
                <MetadataItem label="File Name" value={metadata.fileName} />
                <MetadataItem label="File Size" value={metadata.fileSize} />
                <MetadataItem label="Page Count" value={metadata.pageCount} />
                <MetadataItem 
                  label="Page Size" 
                  value={`${metadata.pageSize.width} x ${metadata.pageSize.height} points`} 
                />
                <MetadataItem 
                  label="Encrypted" 
                  value={metadata.isEncrypted ? 'Yes' : 'No'} 
                />
                <MetadataItem label="PDF Version" value={metadata.PDFFormatVersion} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!metadata && !isLoading && (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Select a PDF file to view its metadata
          </p>
        </div>
      )}
    </div>
  );
}
