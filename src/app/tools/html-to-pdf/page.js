"use client";

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function HTMLToPDF() {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState('');
  const [orientation, setOrientation] = useState('portrait');
  const [paperSize, setPaperSize] = useState('a4');
  const [margins, setMargins] = useState(15);
  const [showPreview, setShowPreview] = useState(false);
  
  const previewRef = useRef(null);
  const contentRef = useRef(null);

  // Handle HTML input change
  const handleHtmlChange = (e) => {
    setHtmlContent(e.target.value);
  };

  // Generate preview of HTML
  const generatePreview = () => {
    if (!htmlContent.trim()) {
      setError('Please enter some HTML content');
      return;
    }
    
    setError('');
    setPreviewHtml(htmlContent);
    setShowPreview(true);
  };

  // Clear the preview
  const clearPreview = () => {
    setShowPreview(false);
  };

  // Convert HTML to PDF
  const convertToPDF = async () => {
    if (!htmlContent.trim()) {
      setError('Please enter some HTML content');
      return;
    }
    
    if (!showPreview) {
      generatePreview();
      // Wait for the preview to render before proceeding
      setTimeout(convertToPDF, 100);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const content = contentRef.current;
      if (!content) {
        throw new Error('Preview content not found');
      }
      
      // Get paper dimensions in mm
      let width, height;
      switch (paperSize) {
        case 'a4':
          width = 210;
          height = 297;
          break;
        case 'letter':
          width = 215.9;
          height = 279.4;
          break;
        case 'legal':
          width = 215.9;
          height = 355.6;
          break;
        default:
          width = 210;
          height = 297;
      }
      
      // Swap dimensions for landscape
      if (orientation === 'landscape') {
        [width, height] = [height, width];
      }
      
      // Create PDF instance with proper orientation
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: paperSize,
      });
      
      // Calculate actual content area (accounting for margins)
      const marginMM = parseInt(margins, 10);
      
      // Capture the content as an image
      const canvas = await html2canvas(content, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Allow loading external resources
        logging: false
      });
      
      // Get the image as data URL
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate the width and height to maintain aspect ratio
      const contentWidth = width - (marginMM * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', marginMM, marginMM, contentWidth, contentHeight);
      
      // Check if content spans multiple pages
      if (contentHeight > (height - (marginMM * 2))) {
        alert('The content is taller than a single page. It will be scaled to fit or you may want to split it manually.');
      }
      
      // Save the PDF
      pdf.save('html-to-pdf.pdf');
    } catch (err) {
      console.error(err);
      setError('Error generating PDF: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load example HTML
  const loadExample = () => {
    const exampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #2563eb;
      text-align: center;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f9fafb;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 0.8em;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sample Document</h1>
    
    <p>This is an example document that demonstrates how HTML content will be converted to PDF format. You can modify this template with your own content.</p>
    
    <div class="info-box">
      <p><strong>Note:</strong> This HTML to PDF converter supports basic HTML elements, CSS styling, and images.</p>
    </div>
    
    <h2>Sample Data Table</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Item 1</td>
          <td>Description of item 1</td>
          <td>$100</td>
        </tr>
        <tr>
          <td>Item 2</td>
          <td>Description of item 2</td>
          <td>$150</td>
        </tr>
        <tr>
          <td>Item 3</td>
          <td>Description of item 3</td>
          <td>$75</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="text-align: right;"><strong>Total:</strong></td>
          <td><strong>$325</strong></td>
        </tr>
      </tfoot>
    </table>
    
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.</p>
    
    <div class="footer">
      <p>Generated with HTML to PDF Converter - PDF Tools</p>
    </div>
  </div>
</body>
</html>
    `;
    
    setHtmlContent(exampleHtml);
  };

  // Use browser's print functionality
  const useBrowserPrint = () => {
    if (!htmlContent.trim()) {
      setError('Please enter some HTML content');
      return;
    }
    
    if (!showPreview) {
      generatePreview();
      // Wait for the preview to render before proceeding
      setTimeout(useBrowserPrint, 100);
      return;
    }
    
    try {
      const content = contentRef.current;
      if (!content) {
        throw new Error('Preview content not found');
      }
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups to use the print function');
        return;
      }
      
      // Write the HTML content to the new window
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Document</title>
            <style>
              @media print {
                body { margin: ${margins}mm; }
                @page { size: ${paperSize} ${orientation}; }
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = function() {
        printWindow.print();
        // Close the window after print dialog (optional)
        // printWindow.close();
      };
    } catch (err) {
      console.error(err);
      setError('Error with browser print: ' + err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        HTML to PDF Converter
      </h1>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gray-700 dark:text-gray-200">
            Enter HTML content:
          </label>
          <button
            onClick={loadExample}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Load Example
          </button>
        </div>
        <textarea
          value={htmlContent}
          onChange={handleHtmlChange}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="<div>Your HTML content here...</div>"
        ></textarea>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">
          PDF Options
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Paper Size:
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </label>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Orientation:
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Margins (mm):
              <input
                type="number"
                min="0"
                max="50"
                value={margins}
                onChange={(e) => setMargins(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mb-6">
        <button
          onClick={generatePreview}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
        >
          Preview HTML
        </button>
        
        <div className="space-x-2">
          <button
            onClick={useBrowserPrint}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            title="Uses browser's print dialog (better quality but less control)"
          >
            Print with Browser
          </button>
          
          <button
            onClick={convertToPDF}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            Convert to PDF
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="ml-3 text-gray-600 dark:text-gray-400">Converting HTML to PDF...</p>
        </div>
      )}
      
      {showPreview && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800 dark:text-white">
              HTML Preview:
            </h3>
            <button
              onClick={clearPreview}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Close Preview
            </button>
          </div>
          
          <div
            ref={previewRef}
            className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white"
          >
            <div
              ref={contentRef}
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Note: The actual PDF output may vary slightly from this preview.
          </p>
        </div>
      )}
      
      {!showPreview && !isLoading && (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Enter HTML content and click Preview to see how it will look in the PDF
          </p>
        </div>
      )}
    </div>
  );
}
