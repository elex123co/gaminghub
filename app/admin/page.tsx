'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { BlogPost, LandingContent } from '@/lib/supabase/types';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'blogs' | 'landing'>('blogs');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [landingContent, setLandingContent] = useState<LandingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingLanding, setEditingLanding] = useState<LandingContent | null>(null);

  // Form states
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
  });

  const [landingForm, setLandingForm] = useState({
    title: '',
    subtitle: '',
    content: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchData = async () => {
    try {
      const [postsRes, landingRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('landing_content')
          .select('*')
          .order('section_key'),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (landingRes.error) throw landingRes.error;

      setPosts(postsRes.data || []);
      setLandingContent(landingRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('blog_posts').insert({
        title: postForm.title,
        slug: postForm.slug,
        content: postForm.content,
        excerpt: postForm.excerpt,
        author_id: user?.id,
        published_at: new Date().toISOString(),
      });

      if (error) throw error;

      await fetchData();
      setShowCreatePost(false);
      setPostForm({ title: '', slug: '', content: '', excerpt: '' });
    } catch (error: any) {
      alert('Error creating post: ' + error.message);
    }
  };

  const updatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: postForm.title,
          slug: postForm.slug,
          content: postForm.content,
          excerpt: postForm.excerpt,
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      await fetchData();
      setEditingPost(null);
      setPostForm({ title: '', slug: '', content: '', excerpt: '' });
    } catch (error: any) {
      alert('Error updating post: ' + error.message);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      alert('Error deleting post: ' + error.message);
    }
  };

  const updateLandingContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLanding) return;

    try {
      let contentData = editingLanding.content;
      
      // Parse the content field properly
      if (landingForm.content) {
        try {
          contentData = JSON.parse(landingForm.content);
        } catch {
          contentData = { text: landingForm.content };
        }
      }

      const { error } = await supabase
        .from('landing_content')
        .update({
          title: landingForm.title,
          subtitle: landingForm.subtitle,
          content: contentData,
        })
        .eq('id', editingLanding.id);

      if (error) throw error;

      await fetchData();
      setEditingLanding(null);
      setLandingForm({ title: '', subtitle: '', content: '' });
    } catch (error: any) {
      alert('Error updating landing content: ' + error.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'blogs'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            Blog Posts
          </button>
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'landing'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            Landing Page
          </button>
        </div>

        {/* Blog Posts Tab */}
        {activeTab === 'blogs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Manage Blog Posts
              </h2>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
              >
                Create New Post
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-8 text-center">
                <p className="text-zinc-600 dark:text-zinc-400">
                  No blog posts yet. Create one to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          Slug: /{post.slug}
                        </p>
                        {post.excerpt && (
                          <p className="text-zinc-700 dark:text-zinc-300">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setPostForm({
                              title: post.title,
                              slug: post.slug,
                              content: post.content,
                              excerpt: post.excerpt || '',
                            });
                          }}
                          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Landing Page Tab */}
        {activeTab === 'landing' && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
              Manage Landing Page Content
            </h2>

            <div className="space-y-4">
              {landingContent.map((section) => (
                <div
                  key={section.id}
                  className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                        {section.section_key}
                      </h3>
                      <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-1">
                        {section.title}
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {section.subtitle}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingLanding(section);
                        setLandingForm({
                          title: section.title || '',
                          subtitle: section.subtitle || '',
                          content: JSON.stringify(section.content, null, 2),
                        });
                      }}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Post Modal */}
      {(showCreatePost || editingPost) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl max-w-3xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h2>
            
            <form onSubmit={editingPost ? updatePost : createPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  required
                  value={postForm.slug}
                  onChange={(e) => setPostForm({ ...postForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Content
                </label>
                <textarea
                  required
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none font-mono text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePost(false);
                    setEditingPost(null);
                    setPostForm({ title: '', slug: '', content: '', excerpt: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
                >
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Landing Content Modal */}
      {editingLanding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl max-w-3xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
              Edit {editingLanding.section_key}
            </h2>
            
            <form onSubmit={updateLandingContent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={landingForm.title}
                  onChange={(e) => setLandingForm({ ...landingForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={landingForm.subtitle}
                  onChange={(e) => setLandingForm({ ...landingForm, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Content (JSON)
                </label>
                <textarea
                  value={landingForm.content}
                  onChange={(e) => setLandingForm({ ...landingForm, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLanding(null);
                    setLandingForm({ title: '', subtitle: '', content: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
                >
                  Update Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}