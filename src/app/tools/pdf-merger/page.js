"use client";

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PDFMerger() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mergeProgress, setMergeProgress] = useState(0);
  
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    
    if (newFiles.length === 0) {
      setError('Please select valid PDF files');
      return;
    }
    
    setError('');
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Clear the input to allow selecting the same files again
    e.target.value = null;
  };

  // Remove file from list
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Reorder files by drag and drop
  const moveFile = (fromIndex, toIndex) => {
    const updatedFiles = [...files];
    const [movedFile] = updatedFiles.splice(fromIndex, 1);
    updatedFiles.splice(toIndex, 0, movedFile);
    setFiles(updatedFiles);
  };

  // Move file up in the list
  const moveUp = (index) => {
    if (index > 0) {
      moveFile(index, index - 1);
    }
  };

  // Move file down in the list
  const moveDown = (index) => {
    if (index < files.length - 1) {
      moveFile(index, index + 1);
    }
  };

  // Merge PDFs
  const mergePDFs = async () => {
    if (files.length < 2) {
      setError('Please select at least two PDF files to merge');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setMergeProgress(0);
    
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress
        setMergeProgress(Math.round((i / files.length) * 100));
        
        try {
          // Convert file to array buffer
          const arrayBuffer = await readFileAsArrayBuffer(file);
          
          // Load the PDF
          const pdf = await PDFDocument.load(arrayBuffer);
          
          // Copy pages from source PDF to merged PDF
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach(page => {
            mergedPdf.addPage(page);
          });
        } catch (err) {
          console.error(`Error processing file ${file.name}:`, err);
          setError(`Error processing ${file.name}. The file might be corrupted or password-protected.`);
          setIsLoading(false);
          return;
        }
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Convert to blob and download
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'merged_document.pdf';
      link.click();
      
      setMergeProgress(100);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setMergeProgress(0);
      }, 1500);
    } catch (err) {
      console.error('Error merging PDFs:', err);
      setError('Error creating merged PDF: ' + err.message);
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

  // Format file size to human readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        PDF Merger Tool
      </h1>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <label className="block text-gray-700 dark:text-gray-200 mr-2">
            Select PDF files to merge:
          </label>
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Files
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            multiple
            className="hidden"
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The PDFs will be merged in the order shown below. You can drag to reorder.
        </p>
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
                style={{ width: `${mergeProgress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {mergeProgress}%
            </span>
          </div>
          <p className="text-center mt-2 text-gray-600 dark:text-gray-400">
            Merging PDF files...
          </p>
        </div>
      )}
      
      {files.length > 0 ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((file, index) => (
              <li key={index} className="px-4 py-3 bg-white dark:bg-gray-800 flex items-center">
                <span className="flex-none w-6 text-gray-500 dark:text-gray-400 text-center">
                  {index + 1}.
                </span>
                <div className="flex-grow ml-3">
                  <div className="font-medium text-gray-800 dark:text-white truncate">
                    {file.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <div className="flex-none flex space-x-1">
                  <button 
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={`p-1 rounded ${index === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title="Move up"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => moveDown(index)}
                    disabled={index === files.length - 1}
                    className={`p-1 rounded ${index === files.length - 1 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title="Move down"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => removeFile(index)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded dark:hover:bg-red-900/30"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected
              </div>
              <button
                onClick={mergePDFs}
                disabled={files.length < 2 || isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                Merge PDFs
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Add at least two PDF files to merge them into one document
          </p>
        </div>
      )}
    </div>
  );
}
