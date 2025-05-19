"use client";

import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the pdf.js worker source
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default function PDFAnnotator() {
  // Refs for canvas elements
  const pdfCanvasRef = useRef(null);
  const annotationCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // PDF document state
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [fileName, setFileName] = useState('');
  
  // Annotation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotationMode, setAnnotationMode] = useState('draw'); // 'draw', 'text', 'highlight'
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [color, setColor] = useState('#FF0000'); // Default red color
  const [lineWidth, setLineWidth] = useState(2);

  // Load PDF document
  const loadPDF = async (file) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async function() {
      try {
        const typedArray = new Uint8Array(this.result);
        const loadingTask = pdfjsLib.getDocument(typedArray);
        
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setPageCount(pdf.numPages);
        setPageNum(1);
        setFileName(file.name);
        setAnnotations([]); // Reset annotations for new document
        
        // Render first page
        renderPage(1, pdf);
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Failed to load PDF document");
      }
    };
    
    fileReader.readAsArrayBuffer(file);
  };

  // Render PDF page
  const renderPage = async (num, doc = pdfDoc) => {
    if (!doc) return;
    
    try {
      // Get the page
      const page = await doc.getPage(num);
      
      // Get the canvas context
      const canvas = pdfCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set the viewport
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Set the annotation canvas to match
      const annotCanvas = annotationCanvasRef.current;
      annotCanvas.height = viewport.height;
      annotCanvas.width = viewport.width;
      
      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Render saved annotations for this page
      renderAnnotations();
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  };

  // Handle page navigation
  const changePage = (offset) => {
    const newPageNum = pageNum + offset;
    if (newPageNum >= 1 && newPageNum <= pageCount) {
      setPageNum(newPageNum);
    }
  };

  // File input change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      loadPDF(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  // Mouse event handlers for drawing
  const handleMouseDown = (e) => {
    if (!pdfDoc) return;
    
    const canvas = annotationCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (annotationMode === 'draw') {
      setIsDrawing(true);
      setCurrentAnnotation({
        type: 'drawing',
        page: pageNum,
        color: color,
        lineWidth: lineWidth,
        points: [{ x, y }]
      });
    } else if (annotationMode === 'text') {
      setTextPosition({ x, y });
      setShowTextInput(true);
    } else if (annotationMode === 'highlight') {
      // Start highlight rectangle
      setIsDrawing(true);
      setCurrentAnnotation({
        type: 'highlight',
        page: pageNum,
        color: color,
        startX: x,
        startY: y,
        width: 0,
        height: 0
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentAnnotation) return;
    
    const canvas = annotationCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (annotationMode === 'draw') {
      setCurrentAnnotation(prev => ({
        ...prev,
        points: [...prev.points, { x, y }]
      }));
      
      // Draw the current stroke
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = currentAnnotation.color;
      ctx.lineWidth = currentAnnotation.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const lastPoint = currentAnnotation.points[currentAnnotation.points.length - 2];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (annotationMode === 'highlight') {
      // Update highlight rectangle dimensions
      setCurrentAnnotation(prev => ({
        ...prev,
        width: x - prev.startX,
        height: y - prev.startY
      }));
      
      // Redraw annotations including the current one
      renderAnnotations(true);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;
    
    setIsDrawing(false);
    setAnnotations(prev => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
  };

  // Handle text annotation
  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    
    if (textInput.trim()) {
      const newAnnotation = {
        type: 'text',
        page: pageNum,
        x: textPosition.x,
        y: textPosition.y,
        text: textInput,
        color: color
      };
      
      setAnnotations(prev => [...prev, newAnnotation]);
      setTextInput('');
      setShowTextInput(false);
      renderAnnotations();
    }
  };

  // Render all annotations for current page
  const renderAnnotations = (includeCurrentAnnotation = false) => {
    if (!annotationCanvasRef.current) return;
    
    const canvas = annotationCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Filter annotations for current page
    const pageAnnotations = annotations.filter(a => a.page === pageNum);
    
    // Draw all saved annotations
    pageAnnotations.forEach(annotation => {
      drawAnnotation(ctx, annotation);
    });
    
    // Draw current annotation if needed
    if (includeCurrentAnnotation && currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation);
    }
  };

  // Draw a single annotation
  const drawAnnotation = (ctx, annotation) => {
    if (annotation.type === 'drawing') {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const points = annotation.points;
      if (points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    } else if (annotation.type === 'text') {
      ctx.font = '16px Arial';
      ctx.fillStyle = annotation.color;
      ctx.fillText(annotation.text, annotation.x, annotation.y);
    } else if (annotation.type === 'highlight') {
      ctx.fillStyle = `${annotation.color}50`; // 50% transparency
      ctx.fillRect(
        annotation.startX,
        annotation.startY,
        annotation.width,
        annotation.height
      );
    }
  };

  // Clear all annotations on current page
  const clearAnnotations = () => {
    setAnnotations(prev => prev.filter(a => a.page !== pageNum));
    renderAnnotations();
  };

  // Save annotated PDF (this is a placeholder - would require a full PDF generation library)
  const saveAnnotatedPDF = () => {
    alert('PDF saving functionality would require a server-side component or a more complex client-side library. This is a demonstration of the annotation capabilities only.');
  };

  // Effect to render page when page number or document changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum);
    }
  }, [pageNum, pdfDoc]);

  // Effect to render annotations when they change
  useEffect(() => {
    renderAnnotations();
  }, [annotations, pageNum]);

  // Clean up effect
  useEffect(() => {
    return () => {
      // Clean up any resources
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [pdfDoc]);

  return (
    <div className="flex flex-col p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">PDF Annotator</h1>
      
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

      {pdfDoc && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <span className="mr-2 text-gray-700 dark:text-gray-200">File: {fileName}</span>
              <span className="text-gray-700 dark:text-gray-200">Page: {pageNum} / {pageCount}</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => changePage(-1)}
                disabled={pageNum <= 1}
                className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
              >
                Previous
              </button>
              <button
                onClick={() => changePage(1)}
                disabled={pageNum >= pageCount}
                className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-wrap gap-2">
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-200 mr-2">Mode:</span>
              <select
                value={annotationMode}
                onChange={(e) => setAnnotationMode(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="draw">Draw</option>
                <option value="text">Add Text</option>
                <option value="highlight">Highlight</option>
              </select>
            </div>
            
            <div className="flex items-center ml-4">
              <span className="text-gray-700 dark:text-gray-200 mr-2">Color:</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="border border-gray-300 rounded w-8 h-8"
              />
            </div>
            
            {annotationMode === 'draw' && (
              <div className="flex items-center ml-4">
                <span className="text-gray-700 dark:text-gray-200 mr-2">Line Width:</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-24"
                />
                <span className="ml-1 text-gray-700 dark:text-gray-200">{lineWidth}</span>
              </div>
            )}
            
            <button
              onClick={clearAnnotations}
              className="ml-auto px-3 py-1 bg-red-600 text-white rounded-md"
            >
              Clear Annotations
            </button>
            
            <button
              onClick={saveAnnotatedPDF}
              className="px-3 py-1 bg-green-600 text-white rounded-md"
            >
              Save Annotated PDF
            </button>
          </div>

          <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* PDF Canvas */}
            <canvas 
              ref={pdfCanvasRef} 
              className="block"
            />
            
            {/* Annotation Canvas (overlay) */}
            <canvas 
              ref={annotationCanvasRef} 
              className="absolute top-0 left-0"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            
            {/* Text Input Overlay */}
            {showTextInput && (
              <div 
                className="absolute"
                style={{
                  left: textPosition.x + 'px',
                  top: textPosition.y + 'px'
                }}
              >
                <form onSubmit={handleTextSubmit} className="bg-white p-2 rounded shadow-lg">
                  <input
                    type="text"
                    value={textInput}
                    onChange={handleTextInputChange}
                    autoFocus
                    className="border border-gray-300 rounded px-2 py-1 mb-1 w-full"
                    placeholder="Enter text"
                  />
                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={() => setShowTextInput(false)}
                      className="px-2 py-1 text-sm bg-gray-300 text-gray-700 rounded mr-1"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </>
      )}

      {!pdfDoc && (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Select a PDF file to annotate
          </p>
        </div>
      )}
    </div>
  );
}
