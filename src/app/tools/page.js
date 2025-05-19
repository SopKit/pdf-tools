"use client";

import { useState } from 'react';
import Link from 'next/link';
import { pdfTools } from '../tools';

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  // Filter tools based on search query and category
  const filteredTools = pdfTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (category === 'all') return matchesSearch;
    
    // Add category logic here if we had categories
    return matchesSearch;
  });

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600">
            Our PDF Processing Tools
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Full collection of professional-grade PDF tools to help you manage, modify, and extract information from your PDF documents
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a specific PDF tool..."
              className="w-full px-6 py-4 rounded-xl border border-blue-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-blue-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
              <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tools list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTools.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.id}`} className="group">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-blue-100 dark:border-blue-900 h-full flex flex-col transform group-hover:-translate-y-1">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-lg shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-bold text-blue-900 dark:text-blue-100">
                    {tool.name}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                  {tool.description}
                </p>
                <div className="mt-auto">
                  <span className="inline-block w-full text-center py-3 px-6 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors duration-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-300">
                    Use Tool →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No results */}
        {filteredTools.length === 0 && (
          <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-900 max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-full">
                <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No tools found</h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">Try adjusting your search query</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-medium rounded-xl shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
