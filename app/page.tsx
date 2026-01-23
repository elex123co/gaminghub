'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { LandingContent } from '@/lib/supabase/types';

interface FeatureItem {
  title: string;
  description: string;
}

interface StepItem {
  title: string;
  description: string;
}

interface ContentData {
  cta?: string;
  description?: string;
  features?: FeatureItem[];
  steps?: StepItem[];
}

export default function Home() {
  const [content, setContent] = useState<Record<string, LandingContent>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_content')
        .select('*');

      if (error) throw error;

      const contentMap = data.reduce((acc: Record<string, LandingContent>, item: LandingContent) => {
        acc[item.section_key] = item;
        return acc;
      }, {} as Record<string, LandingContent>);

      setContent(contentMap);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  const hero = content.hero;
  const about = content.about;
  const valueProps = content.value_props;
  const howItWorks = content.how_it_works;

  const defaultFeatures: FeatureItem[] = [
    { title: 'Real-time Chat', description: 'Connect instantly with your community' },
    { title: 'Easy Group Management', description: 'Create and manage groups effortlessly' },
    { title: 'Secure & Private', description: 'Your data is protected' }
  ];

  const defaultSteps: StepItem[] = [
    { title: 'Sign Up', description: 'Create your account in seconds' },
    { title: 'Join Groups', description: 'Find and join communities that interest you' },
    { title: 'Start Chatting', description: 'Connect with others in real-time' }
  ];

  const features = (valueProps?.content as ContentData)?.features || defaultFeatures;
  const steps = (howItWorks?.content as ContentData)?.steps || defaultSteps;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white mb-6">
              {hero?.title || 'Welcome to Our Community'}
            </h1>
            <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-3xl mx-auto">
              {hero?.subtitle || 'Connect, Share, and Grow Together'}
            </p>
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all transform hover:scale-105"
            >
              {((hero?.content as ContentData)?.cta) || 'Join Community'}
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              {about?.title || 'What We Do'}
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              {about?.subtitle || 'Building meaningful connections'}
            </p>
          </div>
          <p className="text-lg text-zinc-700 dark:text-zinc-300 text-center max-w-3xl mx-auto">
            {((about?.content as ContentData)?.description) || 'We provide a platform for communities to thrive through real-time communication and shared experiences.'}
          </p>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              {valueProps?.title || 'Why Choose Us'}
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              {valueProps?.subtitle || 'Our Key Features'}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature: FeatureItem, idx: number) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              {howItWorks?.title || 'How It Works'}
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              {howItWorks?.subtitle || 'Get started in three simple steps'}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step: StepItem, idx: number) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-zinc-300 mb-8">
            Join thousands of users already connecting on our platform
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-white text-zinc-900 rounded-lg text-lg font-semibold hover:bg-zinc-200 transition-all transform hover:scale-105"
          >
            Join Now
          </Link>
        </div>
      </section>
    </main>
  );
}