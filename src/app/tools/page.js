export default function ToolsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
          Select a PDF Tool
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Choose a tool from the home page to get started
        </p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Go back to Home
        </a>
      </div>
    </div>
  );
}
