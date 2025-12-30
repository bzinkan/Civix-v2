'use client'

import { useState, useEffect } from 'react'
import { animalQuestions } from '@/lib/rules/animals'
import type { DecisionResult } from '@/lib/types/rules'

export default function TesterPage() {
  const [jurisdictions, setJurisdictions] = useState<any[]>([])
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('')
  const [category, setCategory] = useState('animals')
  const [questionKey, setQuestionKey] = useState('pitbull_ownership')
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [result, setResult] = useState<DecisionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [debug, setDebug] = useState(false)

  // Fetch jurisdictions on load
  useEffect(() => {
    fetch('/api/jurisdictions')
      .then((res) => res.json())
      .then((data) => {
        setJurisdictions(data.jurisdictions || [])
        if (data.jurisdictions?.length > 0) {
          setSelectedJurisdiction(data.jurisdictions[0].id)
        }
      })
      .catch((err) => console.error('Failed to load jurisdictions:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdictionId: selectedJurisdiction,
          category,
          questionKey,
          inputs,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.result)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to evaluate decision')
    } finally {
      setLoading(false)
    }
  }

  const question = animalQuestions[questionKey as keyof typeof animalQuestions]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rules Engine Tester</h1>
          <p className="text-gray-600 mt-2">
            Test decision logic with full debug output
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurisdiction
                </label>
                <select
                  value={selectedJurisdiction}
                  onChange={(e) => setSelectedJurisdiction(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  {jurisdictions.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name}, {j.state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="animals">Animals</option>
                  <option value="zoning">Zoning</option>
                </select>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">{question?.title}</h3>

              {question?.fields.map((field) => (
                <div key={field.name} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {field.type === 'select' && (
                    <select
                      value={inputs[field.name] || ''}
                      onChange={(e) =>
                        setInputs({ ...inputs, [field.name]: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={inputs[field.name] || ''}
                      onChange={(e) =>
                        setInputs({ ...inputs, [field.name]: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required={field.required}
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={inputs[field.name] || ''}
                      onChange={(e) =>
                        setInputs({ ...inputs, [field.name]: parseFloat(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required={field.required}
                    />
                  )}
                  {field.type === 'checkbox' && (
                    <input
                      type="checkbox"
                      checked={inputs[field.name] || false}
                      onChange={(e) =>
                        setInputs({ ...inputs, [field.name]: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Evaluating...' : 'Evaluate Decision'}
              </button>
            </form>

            <div className="mt-4">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={debug}
                  onChange={(e) => setDebug(e.target.checked)}
                  className="mr-2"
                />
                Show debug output
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Decision Result</h2>

            {result ? (
              <div>
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    result.outcome === 'ALLOWED'
                      ? 'bg-green-50 border-2 border-green-200'
                      : result.outcome === 'PROHIBITED'
                      ? 'bg-red-50 border-2 border-red-200'
                      : 'bg-yellow-50 border-2 border-yellow-200'
                  }`}
                >
                  <h3
                    className={`font-bold text-lg mb-2 ${
                      result.outcome === 'ALLOWED'
                        ? 'text-green-900'
                        : result.outcome === 'PROHIBITED'
                        ? 'text-red-900'
                        : 'text-yellow-900'
                    }`}
                  >
                    {result.outcome}
                  </h3>
                  <p
                    className={
                      result.outcome === 'ALLOWED'
                        ? 'text-green-800'
                        : result.outcome === 'PROHIBITED'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }
                  >
                    {result.rationale}
                  </p>
                </div>

                {debug && (
                  <div className="mt-4 p-4 bg-gray-50 rounded border">
                    <h4 className="font-semibold text-gray-900 mb-2">Debug Output</h4>
                    <pre className="text-xs text-gray-700 overflow-auto">
                      {JSON.stringify(result.matchedRules, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Submit the form to see results</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
