import { cookies } from 'next/headers';
import LeadCaptureModal from '../components/LeadCaptureModal';
import Image from 'next/image';

const mockTherapists = [
  {
    id: '1',
    name: 'Dr. Sarah Jenkins',
    title: 'Clinical Psychologist',
    bio: 'Specializing in cognitive behavioral therapy for anxiety and depression.',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Anxiety', 'Depression', 'CBT'],
  },
  {
    id: '2',
    name: 'Michael Chen, LCSW',
    title: 'Licensed Clinical Social Worker',
    bio: 'Helping individuals navigate life transitions, stress, and relationship issues.',
    imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Relationships', 'Stress', 'Life Transitions'],
  },
  {
    id: '3',
    name: 'Dr. Emily Parker',
    title: 'Couples Therapist',
    bio: 'Dedicated to fostering healthy communication and intimacy in relationships.',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Couples', 'Communication', 'Family'],
  }
];

export default async function TherapistsPage() {
  const cookieStore = await cookies();
  const hasCaptured = cookieStore.get('lead_captured')?.value === 'true';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Our Expert Therapists
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Find the right professional to guide you on your mental health journey.
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500 ${!hasCaptured ? 'blur-md pointer-events-none select-none opacity-50' : ''}`}>
          {mockTherapists.map((therapist) => (
            <div key={therapist.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="relative h-64 w-full">
                <img
                  src={therapist.imageUrl}
                  alt={therapist.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{therapist.name}</h3>
                  <p className="text-gray-200 font-medium">{therapist.title}</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {therapist.bio}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {therapist.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                  Book Session
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
