/**
 * Enhanced Facebook Video Story Test Component
 * Add this to your project to test the new debugging functions
 */

import React, { useState } from 'react';
import { 
  uploadVideoStoryWithFallback, 
  debugTokenPermissions, 
  testVideoStoryCapability,
  getPageCapabilities,
  uploadVideoStoryAlternative 
} from '@/utils/facebook';

export default function FacebookVideoDebugger() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  // You'll need to get these from your app's state/context
  const pageId = 'YOUR_PAGE_ID'; // Replace with actual page ID
  const accessToken = 'YOUR_ACCESS_TOKEN'; // Replace with actual access token
  const testVideoUrl = 'https://example.com/test-video.mp4'; // Replace with test video

  const addResult = (test, result) => {
    setResults(prev => ({ ...prev, [test]: result }));
  };

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    try {
      console.log(`🔍 Running ${testName}...`);
      const result = await testFunction();
      addResult(testName, { success: true, data: result });
      console.log(`✅ ${testName} completed:`, result);
    } catch (error) {
      addResult(testName, { success: false, error: error.message });
      console.error(`❌ ${testName} failed:`, error);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Token Permissions',
      description: 'Check current token permissions',
      action: () => runTest('permissions', () => debugTokenPermissions(accessToken))
    },
    {
      name: 'Video Story Capability',
      description: 'Test if page can upload video stories',
      action: () => runTest('capability', () => testVideoStoryCapability(pageId, accessToken))
    },
    {
      name: 'Page Capabilities',
      description: 'Get detailed page information',
      action: () => runTest('pageInfo', () => getPageCapabilities(pageId, accessToken))
    },
    {
      name: 'Enhanced Video Upload',
      description: 'Try enhanced video story upload with fallback',
      action: () => runTest('enhancedUpload', () => 
        uploadVideoStoryWithFallback(accessToken, 'Test video story', pageId, null, null, testVideoUrl)
      )
    },
    {
      name: 'Alternative Upload',
      description: 'Try alternative video story upload method',
      action: () => runTest('alternativeUpload', () => 
        uploadVideoStoryAlternative(pageId, accessToken, testVideoUrl, 'Test alternative upload')
      )
    }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔍 Facebook Video Story Debugger</h2>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">⚠️ Setup Required</h3>
        <p className="text-yellow-700 text-sm mt-1">
          Please update the pageId, accessToken, and testVideoUrl variables in this component
          with your actual values before running tests.
        </p>
      </div>

      <div className="grid gap-4">
        {tests.map((test, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{test.name}</h3>
                <p className="text-sm text-gray-600">{test.description}</p>
              </div>
              <button
                onClick={test.action}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Running...' : 'Run Test'}
              </button>
            </div>
            
            {results[test.name.toLowerCase().replace(' ', '')] && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <div className="font-medium mb-1">
                  {results[test.name.toLowerCase().replace(' ', '')].success ? '✅ Success' : '❌ Failed'}
                </div>
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(
                    results[test.name.toLowerCase().replace(' ', '')].success 
                      ? results[test.name.toLowerCase().replace(' ', '')].data 
                      : results[test.name.toLowerCase().replace(' ', '')].error, 
                    null, 2
                  )}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800">💡 Next Steps</h3>
        <ul className="text-blue-700 text-sm mt-2 space-y-1">
          <li>• Run "Token Permissions" first to check your current permissions</li>
          <li>• If video story capability fails with error 200, your app needs Facebook review</li>
          <li>• Check the browser console for detailed error logs</li>
          <li>• Use the "Enhanced Video Upload" which includes automatic fallback to regular video</li>
        </ul>
      </div>
    </div>
  );
}
