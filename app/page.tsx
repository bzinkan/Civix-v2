import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Civix
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Regulatory Decision Engine
          </p>
          <p className="text-lg text-gray-500">
            Clear, defensible answers to compliance questions
          </p>
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Is this allowed here?
          </h2>
          <p className="text-gray-700 mb-6">
            Across cities, towns, and jurisdictions, compliance rules are scattered across
            PDFs, written in legal language, and difficult to interpret. Civix centralizes
            these rules and delivers clear, authoritative answers.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Free Answers</h3>
              <p className="text-gray-600">
                Get clear yes/no/conditional decisions with rationale and rule citations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Paid Reports</h3>
              <p className="text-gray-600">
                Execution-ready compliance guidance with steps, forms, and providers.
              </p>
            </div>
          </div>
        </div>

        {/* Question Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            What can Civix answer?
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/tester?category=animals"
              className="bg-blue-50 hover:bg-blue-100 rounded-lg p-6 border-2 border-blue-200 transition-colors"
            >
              <h3 className="font-semibold text-blue-900 mb-2">Animal Regulations</h3>
              <p className="text-blue-700 text-sm">
                Breed restrictions, ownership requirements, permits
              </p>
            </Link>
            <Link
              href="/dashboard/tester?category=zoning"
              className="bg-green-50 hover:bg-green-100 rounded-lg p-6 border-2 border-green-200 transition-colors"
            >
              <h3 className="font-semibold text-green-900 mb-2">Zoning & Property</h3>
              <p className="text-green-700 text-sm">
                Fences, setbacks, construction, land use
              </p>
            </Link>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 opacity-60">
              <h3 className="font-semibold text-gray-600 mb-2">Business Licensing</h3>
              <p className="text-gray-500 text-sm">
                Coming soon
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 opacity-60">
              <h3 className="font-semibold text-gray-600 mb-2">Construction Permits</h3>
              <p className="text-gray-500 text-sm">
                Coming soon
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard/tester"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Try the Decision Engine
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Test the rules engine with sample jurisdictions
          </p>
        </div>
      </div>
    </main>
  )
}
