"use client";

import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the pdf.js worker source
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default function PDFTextExtractor() {
  const [pdfText, setPdfText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);

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
    setPdfText('');
    setExtractionProgress(0);
    
    try {
      const text = await extractTextFromPdf(file);
      setPdfText(text);
    } catch (err) {
      console.error(err);
      setError('Failed to extract text from PDF. ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract text from PDF
  const extractTextFromPdf = async (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        try {
          const typedArray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          
          setPageCount(pdf.numPages);
          let fullText = '';
          
          // Process each page
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Concatenate the text items
            const pageText = textContent.items
              .map(item => item.str)
              .join(' ');
            
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
            
            // Update progress
            setExtractionProgress(Math.round((i / pdf.numPages) * 100));
          }
          
          resolve(fullText.trim());
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

  // Copy text to clipboard
  const copyToClipboard = () => {
    if (!pdfText) return;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pdfText)
        .then(() => {
          alert('Text copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          // Fallback method
          copyUsingTextArea();
        });
    } else {
      // For browsers without clipboard API
      copyUsingTextArea();
    }
  };

  // Fallback copy method
  const copyUsingTextArea = () => {
    textAreaRef.current.select();
    document.execCommand('copy');
    alert('Text copied to clipboard');
  };

  // Download text as file
  const downloadText = () => {
    if (!pdfText) return;
    
    const element = document.createElement('a');
    const file = new Blob([pdfText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    
    // Generate filename from original PDF name
    let textFileName = fileName.toLowerCase().endsWith('.pdf')
      ? fileName.substring(0, fileName.length - 4) + '.txt'
      : fileName + '.txt';
    
    element.download = textFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        PDF to Text Extractor
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
                style={{ width: `${extractionProgress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {extractionProgress}%
            </span>
          </div>
          <p className="text-center mt-2 text-gray-600 dark:text-gray-400">
            Extracting text from PDF...
          </p>
        </div>
      )}
      
      {pdfText && !isLoading && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <span className="text-gray-700 dark:text-gray-200">
                File: {fileName} ({pageCount} pages)
              </span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Copy Text
              </button>
              <button
                onClick={downloadText}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Download as TXT
              </button>
            </div>
          </div>
          
          <div className="border border-gray-300 rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
            <textarea
              ref={textAreaRef}
              className="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none rounded-lg dark:bg-gray-800 dark:text-gray-200"
              value={pdfText}
              readOnly
            ></textarea>
          </div>
        </>
      )}
      
      {!pdfText && !isLoading && (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Select a PDF file to extract text
          </p>
        </div>
      )}
    </div>
  );
}
