"use client";

import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the pdf.js worker source
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default function PasswordPDFChecker() {
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [password, setPassword] = useState('');
  const [pdfData, setPdfData] = useState(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setResult({
        isProtected: false,
        error: 'Please select a valid PDF file'
      });
      return;
    }
    
    setFileName(file.name);
    setIsLoading(true);
    setResult(null);
    setPdfData(null);
    setShowPasswordInput(false);
    
    try {
      // Read the file
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        const typedArray = new Uint8Array(this.result);
        
        // Save PDF data for later use if password needed
        setPdfData(typedArray);
        
        // Try to open the PDF without a password
        try {
          const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            password: '' // Try empty password
          });
          
          const pdf = await loadingTask.promise;
          
          // If we get here, the file is not password-protected or was unlocked with empty password
          
          // Try to get the first page to confirm access
          await pdf.getPage(1);
          
          setResult({
            isProtected: false,
            message: 'This PDF is not password-protected.',
            pdf: pdf
          });
        } catch (err) {
          console.error(err);
          
          if (err.name === 'PasswordException') {
            // The file is password-protected
            setResult({
              isProtected: true,
              message: 'This PDF is password-protected.',
              errorCode: err.code
            });
            setShowPasswordInput(true);
          } else {
            // Some other error occurred
            setResult({
              isProtected: false,
              error: 'Error analyzing PDF: ' + err.message
            });
          }
        }
      };
      
      fileReader.onerror = function() {
        setResult({
          isProtected: false,
          error: 'Failed to read the file'
        });
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setResult({
        isProtected: false,
        error: 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Try to unlock with password
  const tryUnlock = async (e) => {
    e.preventDefault();
    
    if (!pdfData || !password) return;
    
    setIsLoading(true);
    
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        password: password
      });
      
      const pdf = await loadingTask.promise;
      
      // Try to access a page to verify
      await pdf.getPage(1);
      
      setResult({
        isProtected: true,
        message: 'PDF successfully unlocked with the provided password!',
        isUnlocked: true,
        pdf: pdf
      });
      
      // Render the first page as proof
      renderPage(pdf);
      
      // Hide the password input
      setShowPasswordInput(false);
    } catch (err) {
      console.error(err);
      
      if (err.name === 'PasswordException') {
        // Wrong password
        setResult({
          isProtected: true,
          message: 'This PDF is password-protected.',
          error: 'Incorrect password. Please try again.',
          errorCode: err.code
        });
      } else {
        // Some other error
        setResult({
          isProtected: true,
          error: 'Error unlocking PDF: ' + err.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render the first page of the PDF
  const renderPage = async (pdf) => {
    try {
      const page = await pdf.getPage(1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Scale the view to fit within a reasonable size
      const viewport = page.getViewport({ scale: 0.8 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  };

  // Get icon and color based on protection status
  const getStatusInfo = () => {
    if (!result) return { icon: 'question', color: 'gray' };
    
    if (result.isProtected) {
      if (result.isUnlocked) {
        return { icon: 'unlock', color: 'green' };
      }
      return { icon: 'lock', color: 'red' };
    }
    
    return { icon: 'shield-check', color: 'green' };
  };

  const { icon, color } = getStatusInfo();

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Password-Protected PDF Checker
      </h1>
      
      <div className="mb-6">
        <label className="block mb-2">
          <span className="text-gray-700 dark:text-gray-200">Select a PDF file to check:</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </label>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="ml-3 text-gray-600 dark:text-gray-400">Analyzing PDF file...</p>
        </div>
      )}
      
      {result && !isLoading && (
        <div className={`p-6 rounded-lg shadow-md bg-white dark:bg-gray-800 border ${
          result.error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center mb-4">
            <div className={`bg-${color}-100 dark:bg-${color}-900/30 p-3 rounded-full`}>
              {icon === 'lock' && (
                <svg className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {icon === 'unlock' && (
                <svg className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              )}
              {icon === 'shield-check' && (
                <svg className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {icon === 'question' && (
                <svg className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {result.isProtected ? 'Password Protected' : 'Not Password Protected'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {fileName}
              </p>
            </div>
          </div>
          
          {result.message && (
            <div className="mb-4 text-gray-600 dark:text-gray-300">
              {result.message}
            </div>
          )}
          
          {result.error && (
            <div className="text-red-500 mb-4">
              {result.error}
            </div>
          )}
          
          {showPasswordInput && (
            <form onSubmit={tryUnlock} className="mt-4">
              <div className="flex">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                >
                  Unlock
                </button>
              </div>
            </form>
          )}
          
          {result.isUnlocked && (
            <div className="mt-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <canvas ref={canvasRef} className="mx-auto"></canvas>
              </div>
              <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                First page preview (PDF successfully unlocked)
              </p>
            </div>
          )}
        </div>
      )}
      
      {!result && !isLoading && (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Select a PDF file to check if it's password-protected
          </p>
        </div>
      )}
    </div>
  );
}
