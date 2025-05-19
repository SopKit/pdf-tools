"use client";

import { useState } from 'react';
import Link from 'next/link';
import { pdfTools } from './tools';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'popular'

  // Filter tools based on search query
  const filteredTools = pdfTools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort tools based on sortBy state
  const sortedTools = [...filteredTools].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0; // Default no sorting
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
            PDF Tools
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Powerful PDF tools built with pure JavaScript
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mb-8">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Search tools..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <select
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="popular">Sort by Popularity</option>
            </select>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTools.map((tool, index) => (
            <Link 
              href={`/tools/${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
              key={index}
              className="block"
            >
              <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="ml-4 text-xl font-semibold text-gray-800 dark:text-white">
                      {tool.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {tool.description}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                      Use Tool
                      <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {sortedTools.length === 0 && (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow">
            <h3 className="text-xl font-medium text-gray-800 dark:text-white">No tools found</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Try adjusting your search query</p>
          </div>
        )}
      </main>
    </div>
  );
}
