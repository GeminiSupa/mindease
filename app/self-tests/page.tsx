import { cookies } from 'next/headers';
import LeadCaptureModal from '../components/LeadCaptureModal';

const mockTests = [
  {
    id: '1',
    title: 'Anxiety Assessment',
    description: 'A short questionnaire to help you understand your anxiety levels and whether you might benefit from professional support.',
    time: '3 min',
    questionsCount: 7,
  },
  {
    id: '2',
    title: 'Depression Screening',
    description: 'Evaluate feelings of sadness, loss of interest, and other common symptoms of depression.',
    time: '5 min',
    questionsCount: 9,
  },
  {
    id: '3',
    title: 'Relationship Health Check',
    description: 'Assess the communication and emotional connection in your current relationship.',
    time: '4 min',
    questionsCount: 8,
  }
];

export default async function SelfTestsPage() {
  const cookieStore = await cookies();
  const hasCaptured = cookieStore.get('lead_captured')?.value === 'true';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Mental Health Self-Tests
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            Take the first step towards understanding your mental health.
          </p>
        </div>

        <div className={`space-y-6 transition-all duration-500 ${!hasCaptured ? 'blur-md pointer-events-none select-none opacity-50' : ''}`}>
          {mockTests.map((test) => (
            <div key={test.id} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    {test.time}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {test.questionsCount} questions
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{test.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {test.description}
                </p>
              </div>
              <div>
                <button className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                  Start Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasCaptured && <LeadCaptureModal />}
    </div>
  );
}
