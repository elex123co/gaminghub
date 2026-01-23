'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { BlogPost } from '@/lib/supabase/types';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles(username)
        `)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-8">
          Blog
        </h1>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              No blog posts yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-md transition"
              >
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 hover:text-zinc-700 dark:hover:text-zinc-300 transition">
                    {post.title}
                  </h2>
                </Link>
                
                <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  <span>{post.author?.username || 'Anonymous'}</span>
                  <span>•</span>
                  <time>{formatDate(post.published_at!)}</time>
                </div>

                {post.excerpt && (
                  <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                    {post.excerpt}
                  </p>
                )}

                <Link
                  href={`/blog/${post.slug}`}
                  className="text-zinc-900 dark:text-white font-semibold hover:underline"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}