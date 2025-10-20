'use client'

import { useState } from 'react'

export default function TestAPIs() {
    const [results, setResults] = useState<any>(null)
    const [freeResults, setFreeResults] = useState<any>(null)
    const [openWebResults, setOpenWebResults] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [freeLoading, setFreeLoading] = useState(false)
    const [openWebLoading, setOpenWebLoading] = useState(false)

    const testAPIs = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/test-apis')
            const data = await response.json()
            setResults(data)
        } catch (error) {
            setResults({ error: 'Failed to test APIs', message: error instanceof Error ? error.message : 'Unknown error' })
        }
        setLoading(false)
    }

    const testFreeAPIs = async () => {
        setFreeLoading(true)
        try {
            const response = await fetch('/api/free-job-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords: 'developer', location: 'Remote' })
            })
            const data = await response.json()
            setFreeResults(data)
        } catch (error) {
            setFreeResults({ error: 'Failed to test free APIs', message: error instanceof Error ? error.message : 'Unknown error' })
        }
        setFreeLoading(false)
    }

    const testOpenWebNinja = async () => {
        setOpenWebLoading(true)
        try {
            const response = await fetch('/api/test-openweb-ninja', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: 'javascript developer',
                    location: 'chicago'
                })
            })

            const data = await response.json()
            setOpenWebResults(data)
        } catch (error) {
            setOpenWebResults({
                error: 'Failed to test OpenWeb Ninja API',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        }
        setOpenWebLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 API Testing Dashboard</h1>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Test Job Search APIs</h2>
                    <p className="text-gray-600 mb-4">
                        This will test your JSearch (RapidAPI) and Adzuna API credentials to see which ones are working.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={testAPIs}
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '🔄 Testing Paid APIs...' : '🧪 Test Paid APIs'}
                        </button>

                        <button
                            onClick={testOpenWebNinja}
                            disabled={openWebLoading}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {openWebLoading ? '🔄 Testing OpenWeb Ninja...' : '🥷 Test OpenWeb Ninja'}
                        </button>

                        <button
                            onClick={testFreeAPIs}
                            disabled={freeLoading}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {freeLoading ? '🔄 Testing Free APIs...' : '🆓 Test Free APIs'}
                        </button>
                    </div>
                </div>

                {results && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">📊 Test Results</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Environment Variables</h4>
                                    <div className="space-y-1 text-sm">
                                        <div>RapidAPI Key: <span className="font-mono">{results.rapidApiKey}</span></div>
                                        <div>Adzuna App ID: <span className="font-mono">{results.adzunaAppId}</span></div>
                                        <div>Adzuna App Key: <span className="font-mono">{results.adzunaAppKey}</span></div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">API Tests</h4>
                                    <div className="space-y-1 text-sm">
                                        <div>JSearch API: <span className="font-mono">{results.jsearchTest}</span></div>
                                        <div>Adzuna API: <span className="font-mono">{results.adzunaTest}</span></div>
                                    </div>
                                </div>
                            </div>

                            {(results.jsearchTest?.includes('❌') || results.adzunaTest?.includes('❌')) && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-800 mb-2">🔧 Troubleshooting</h4>

                                    {results.jsearchTest?.includes('You are not subscribed') && (
                                        <div className="mb-2">
                                            <strong>JSearch Issue:</strong> You need to subscribe to the JSearch API on RapidAPI:
                                            <ol className="list-decimal list-inside mt-1 text-sm">
                                                <li>Go to: <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" target="_blank" className="text-blue-600 underline">JSearch on RapidAPI</a></li>
                                                <li>Click "Subscribe to Test"</li>
                                                <li>Choose "Basic" plan (FREE - 2,500 requests/month)</li>
                                                <li>Click "Subscribe"</li>
                                            </ol>
                                        </div>
                                    )}

                                    {results.adzunaTest?.includes('❌') && (
                                        <div className="mb-2">
                                            <strong>Adzuna Issue:</strong> Check your Adzuna credentials:
                                            <ol className="list-decimal list-inside mt-1 text-sm">
                                                <li>Verify App ID and Key at: <a href="https://developer.adzuna.com/" target="_blank" className="text-blue-600 underline">Adzuna Developer Portal</a></li>
                                                <li>Make sure your account is activated</li>
                                                <li>Check the API documentation for any changes</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            )}

                            {results.jsearchTest?.includes('✅') || results.adzunaTest?.includes('✅') ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">✅ Success!</h4>
                                    <p className="text-green-700">
                                        At least one API is working! You can now use the anonymous job matching feature.
                                    </p>
                                    <a
                                        href="/anonymous-jobs"
                                        className="inline-block mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Try Job Matching
                                    </a>
                                </div>
                            ) : null}
                        </div>

                        <pre className="mt-4 bg-gray-100 p-4 rounded text-xs overflow-auto">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </div>
                )}

                {openWebResults && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                        <h3 className="text-lg font-semibold mb-4">🥷 OpenWeb Ninja JSearch Test Results</h3>

                        {openWebResults.error ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="font-semibold text-red-800 mb-2">❌ OpenWeb Ninja Failed</h4>
                                <p className="text-red-700">{openWebResults.message}</p>

                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <h5 className="font-semibold text-yellow-800">💡 Troubleshooting Tips:</h5>
                                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                                        <li>• Check if OPENWEB_NINJA_API_KEY is set in .env.local</li>
                                        <li>• Verify API key is valid: ak_5huffd92tgvbrfecpyy7ctwo4e85c8a2oeotz2kcy7q4li8r</li>
                                        <li>• Test the endpoint manually: https://api.openwebninja.com/jsearch</li>
                                        <li>• Check if you have sufficient quota on OpenWeb Ninja</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">✅ OpenWeb Ninja Working!</h4>
                                    <p className="text-green-700 mb-2">
                                        {openWebResults.message}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        Jobs returned: {openWebResults.jobs?.length || 0}
                                    </p>
                                </div>

                                {openWebResults.jobs && openWebResults.jobs.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold">Sample Jobs:</h4>
                                        {openWebResults.jobs.slice(0, 3).map((job: any, index: number) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-purple-400">
                                                <h5 className="font-semibold">{job.title}</h5>
                                                <p className="text-sm text-gray-600">{job.company} - {job.location}</p>
                                                <p className="text-sm text-gray-500 mt-1">{job.description?.slice(0, 150)}...</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <pre className="mt-4 bg-gray-100 p-4 rounded text-xs overflow-auto">
                            {JSON.stringify(openWebResults, null, 2)}
                        </pre>
                    </div>
                )}

                {freeResults && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                        <h3 className="text-lg font-semibold mb-4">🆓 Free Job APIs Test Results</h3>

                        {freeResults.error ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="font-semibold text-red-800 mb-2">❌ Free APIs Failed</h4>
                                <p className="text-red-700">{freeResults.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">✅ Free APIs Working!</h4>
                                    <p className="text-green-700 mb-2">
                                        Found {freeResults.total} jobs from multiple free sources:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {freeResults.jobs?.slice(0, 4).map((job: any, index: number) => (
                                            <div key={index} className="bg-white p-3 rounded border">
                                                <h5 className="font-semibold text-sm">{job.title}</h5>
                                                <p className="text-xs text-gray-600">{job.company} • {job.location}</p>
                                                <p className="text-xs text-blue-600">{job.source}</p>
                                                {job.salary && <p className="text-xs text-green-600">{job.salary}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    <a
                                        href="/anonymous-jobs"
                                        className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Use Free Job Matching
                                    </a>
                                </div>
                            </div>
                        )}

                        <pre className="mt-4 bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(freeResults, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}