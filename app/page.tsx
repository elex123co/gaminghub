'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { LandingContent } from '@/lib/supabase/types';
import Leaderboard from '@/components/Leaderboard';

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

      const contentMap = data.reduce((acc, item) => {
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const stats = [
    { number: '2000+', label: 'TikTok Followers' },
    { number: '240+', label: 'Discord Members' },
    { number: '2000+', label: 'WhatsApp Members' },
    { number: '20+', label: 'Tournaments Hosted' },
  ];

  const partners = [
    'Metacene',
    'Engy Africa',
    'Gacom',
    'Escape The Matrix',
    'Vikuverse',
    'Carry1st',
  ];

  const benefits = [
    {
      title: 'Brand Visibility',
      description: 'Get your logo and name on our social media, streams, and events.',
      icon: '👁️',
    },
    {
      title: 'Product Promotion',
      description: 'Promote your products through banners, videos, and posts.',
      icon: '📢',
    },
    {
      title: 'Targeted Audience',
      description: 'Connect with gamers who love gaming products.',
      icon: '🎯',
    },
    {
      title: 'Brand Trust',
      description: 'Gamers will trust and support brands that invest in their community.',
      icon: '🤝',
    },
    {
      title: 'Live Engagement',
      description: 'Sponsor live streams, game reviews, product testings and unboxings.',
      icon: '📺',
    },
    {
      title: 'Market Insights',
      description: 'Get insights on what gamers like and buy.',
      icon: '📊',
    },
  ];

  const coverage = [
    'Nigeria',
    'Kenya',
    'Ghana',
    'South Africa',
    'Egypt',
    'Syria',
    'Rwanda',
    'Uganda',
    'Burkina Faso',
    'Ivory Coast',
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-black to-black">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-50 animate-pulse"></div>
                <img
                  src="https://res.cloudinary.com/dtd4ehd1s/image/upload/v1769257603/gaming-hub-logo-removebg-preview_u4y6pt.png"
                  alt="The Gaming Hub Logo"
                  className="relative z-10 drop-shadow-2xl w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              The Gaming Hub
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Africa's Premier Esports Community
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Strengthening Esports in West Africa through community growth, tournaments, and opportunities for the next generation of gamers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
              >
                Join Our Community
              </Link>
              <Link
                href="#sponsors"
                className="inline-block px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-purple-500 text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all"
              >
                Become a Sponsor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-black to-purple-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-purple-400">
                Who We Are
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  <strong className="text-white">The Gaming Hub</strong> is an Africa-centered Esports Community with regional and foreign associations. Founded in August 2024 by Opemipo, alongside co-founders Tiger, Void, Emmanuel, and Drael.
                </p>
                <p>
                  Our vision is to <strong className="text-purple-400">strengthen Esports in West Africa</strong> by organizing various esports tournaments and making esports a safe haven for younger generations to pursue as a career with discipline and dedication.
                </p>
                <p>
                  We've been intensified and structured through the help of key admins Nathan and Ayomide (Kana), hosting various games that engage gamers across West Africa and beyond.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-8 border border-purple-500/30">
              <h3 className="text-2xl font-bold mb-6 text-purple-300">Our Reach</h3>
              <div className="flex flex-wrap gap-3">
                {coverage.map((country, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-black/50 rounded-full text-sm border border-purple-500/50 hover:border-purple-500 transition"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-gradient-to-b from-purple-950/20 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-purple-400">
            Trusted Partners
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {partners.map((partner, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 flex items-center justify-center hover:bg-white/10 hover:border-purple-500 transition"
              >
                <span className="text-center font-semibold text-gray-300">
                  {partner}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">
              Major Impact: Carry1st X The Gaming Hub Spin-off Challenge
            </p>
            <p className="text-sm text-gray-500">
              Players from Egypt, Ghana, Kenya, Rwanda, Uganda, Burkina Faso, and Ivory Coast
            </p>
          </div>
        </div>
      </section>

      {/* Sponsorship Benefits Section */}
      <section id="sponsors" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Why Sponsor The Gaming Hub?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Sponsoring The Gaming Hub isn't an expense—it's a strategic partnership with a high-potential, engaged audience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30 hover:border-purple-500 transition group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-purple-300">
                  {benefit.title}
                </h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Invest in Africa's Gaming Future?
            </h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join us in building the largest esports community in West Africa. Connect with passionate gamers and grow your brand.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-4 bg-black text-white rounded-lg text-lg font-semibold hover:bg-gray-900 transition-all transform hover:scale-105"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-b from-black to-purple-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-purple-400">
              Our Impact
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8">
                <div className="text-4xl font-bold text-purple-400 mb-2">$1,200</div>
                <div className="text-gray-400">Invested in Tournaments</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8">
                <div className="text-4xl font-bold text-pink-400 mb-2">20+</div>
                <div className="text-gray-400">Events Hosted</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8">
                <div className="text-4xl font-bold text-purple-400 mb-2">6+</div>
                <div className="text-gray-400">Brand Partnerships</div>
              </div>
            </div>
            <div className="space-y-4 text-gray-400">
              <p className="text-lg">
                🎮 2000+ followers on TikTok | 240+ Discord members | 2000+ WhatsApp members
              </p>
              <p className="text-lg">
                📺 200+ YouTube subscribers with 500+ views per video
              </p>
              <p className="text-lg">
                🌍 Active presence across Nigeria, Kenya, Ghana, South Africa, Egypt, and more
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Hall of Champions
            </h2>
            <p className="text-xl text-gray-400">
              Celebrating our tournament winners and top performers
            </p>
          </div>
          <Leaderboard />
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 bg-black border-t border-purple-500/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Join the Revolution
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Be part of Africa's fastest-growing esports community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/community"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              Explore Community
            </Link>
            <Link
              href="/blog"
              className="inline-block px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-purple-500 text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all"
            >
              Read Our Blog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}