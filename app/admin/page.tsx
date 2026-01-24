'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { BlogPost, Profile, Game, LeaderboardEntry } from '@/lib/supabase/types';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'blogs' | 'leaderboard' | 'games'>('users');
  
  // Users state
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userStats, setUserStats] = useState({ total: 0, byCountry: {} as Record<string, number> });
  
  // Blog state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState({ title: '', slug: '', content: '', excerpt: '' });
  
  // Leaderboard state
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
  const [entryForm, setEntryForm] = useState({
    user_id: '',
    game_id: '',
    tournament_name: '',
    position: 1,
    prize: '',
    score: '',
    date_achieved: new Date().toISOString().split('T')[0],
  });
  const [gameForm, setGameForm] = useState({ name: '', description: '' });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/');
      } else {
        fetchAllData();
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchUsers(),
      fetchPosts(),
      fetchLeaderboard(),
      fetchGames(),
    ]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const byCountry = (data || []).reduce((acc, user) => {
        const country = user.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setUserStats({ total, byCountry });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          user:profiles(*),
          game:games(*)
        `)
        .order('date_achieved', { ascending: false });

      if (error) throw error;
      setLeaderboardEntries(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('name');

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  // Blog functions
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
      await fetchPosts();
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
      await fetchPosts();
      setEditingPost(null);
      setPostForm({ title: '', slug: '', content: '', excerpt: '' });
    } catch (error: any) {
      alert('Error updating post: ' + error.message);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      await fetchPosts();
    } catch (error: any) {
      alert('Error deleting post: ' + error.message);
    }
  };

  // Leaderboard functions
  const createEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('leaderboard_entries').insert(entryForm);
      if (error) throw error;
      
      await fetchLeaderboard();
      setShowCreateEntry(false);
      setEntryForm({
        user_id: '',
        game_id: '',
        tournament_name: '',
        position: 1,
        prize: '',
        score: '',
        date_achieved: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      alert('Error creating entry: ' + error.message);
    }
  };

  const updateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('leaderboard_entries')
        .update(entryForm)
        .eq('id', editingEntry.id);

      if (error) throw error;
      await fetchLeaderboard();
      setEditingEntry(null);
      setEntryForm({
        user_id: '',
        game_id: '',
        tournament_name: '',
        position: 1,
        prize: '',
        score: '',
        date_achieved: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      alert('Error updating entry: ' + error.message);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase.from('leaderboard_entries').delete().eq('id', id);
      if (error) throw error;
      await fetchLeaderboard();
    } catch (error: any) {
      alert('Error deleting entry: ' + error.message);
    }
  };

  const createGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('games').insert(gameForm);
      if (error) throw error;
      
      await fetchGames();
      setShowCreateGame(false);
      setGameForm({ name: '', description: '' });
    } catch (error: any) {
      alert('Error creating game: ' + error.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <main className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['users', 'blogs', 'leaderboard', 'games'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-purple-500/30'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Total Users</h3>
                <p className="text-4xl font-bold text-white">{userStats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Countries</h3>
                <p className="text-4xl font-bold text-white">{Object.keys(userStats.byCountry).length}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Top Country</h3>
                <p className="text-2xl font-bold text-white">
                  {Object.entries(userStats.byCountry).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">City</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/20">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-purple-900/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.country || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.city || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' 
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Blogs Tab */}
        {activeTab === 'blogs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Blog Posts</h2>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
              >
                Create New Post
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center border border-purple-500/30">
                <p className="text-gray-400">No blog posts yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{post.title}</h3>
                        <p className="text-sm text-purple-300 mb-2">Slug: /{post.slug}</p>
                        {post.excerpt && <p className="text-gray-400">{post.excerpt}</p>}
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
                          className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition border border-red-500/50"
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

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Leaderboard</h2>
              <button
                onClick={() => setShowCreateEntry(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
              >
                Add Winner
              </button>
            </div>

            {leaderboardEntries.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center border border-purple-500/30">
                <p className="text-gray-400">No leaderboard entries yet. Add winners!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboardEntries.map((entry) => (
                  <div key={entry.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                            entry.position === 1 ? 'bg-yellow-500 text-black' :
                            entry.position === 2 ? 'bg-gray-300 text-black' :
                            entry.position === 3 ? 'bg-orange-600 text-white' :
                            'bg-purple-500 text-white'
                          }`}>
                            #{entry.position}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white">{entry.user?.username}</h3>
                            <p className="text-sm text-purple-300">{entry.game?.name} - {entry.tournament_name}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-400">Prize</p>
                            <p className="text-white">{entry.prize || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Score</p>
                            <p className="text-white">{entry.score || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Date</p>
                            <p className="text-white">{new Date(entry.date_achieved).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Country</p>
                            <p className="text-white">{entry.user?.country || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setEntryForm({
                              user_id: entry.user_id,
                              game_id: entry.game_id,
                              tournament_name: entry.tournament_name,
                              position: entry.position,
                              prize: entry.prize || '',
                              score: entry.score || '',
                              date_achieved: entry.date_achieved,
                            });
                          }}
                          className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition border border-red-500/50"
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

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Games</h2>
              <button
                onClick={() => setShowCreateGame(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
              >
                Add Game
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <div key={game.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 hover:border-purple-500 transition">
                  <h3 className="text-lg font-semibold text-white mb-2">{game.name}</h3>
                  <p className="text-sm text-gray-400">{game.description || 'No description'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Post Modal */}
      {(showCreatePost || editingPost) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gradient-to-br from-purple-900/90 to-black rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8 border border-purple-500/50">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h2>
            
            <form onSubmit={editingPost ? updatePost : createPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Slug (URL)</label>
                <input
                  type="text"
                  required
                  value={postForm.slug}
                  onChange={(e) => setPostForm({ ...postForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Excerpt</label>
                <textarea
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Content</label>
                <textarea
                  required
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white resize-none font-mono text-sm"
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
                  className="flex-1 px-4 py-2 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
                >
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Leaderboard Entry Modal */}
      {(showCreateEntry || editingEntry) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gradient-to-br from-purple-900/90 to-black rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8 border border-purple-500/50">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingEntry ? 'Edit Winner' : 'Add Winner'}
            </h2>
            
            <form onSubmit={editingEntry ? updateEntry : createEntry} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">User</label>
                  <select
                    required
                    value={entryForm.user_id}
                    onChange={(e) => setEntryForm({ ...entryForm, user_id: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                  >
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Game</label>
                  <select
                    required
                    value={entryForm.game_id}
                    onChange={(e) => setEntryForm({ ...entryForm, game_id: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                  >
                    <option value="">Select game</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Tournament Name</label>
                <input
                  type="text"
                  required
                  value={entryForm.tournament_name}
                  onChange={(e) => setEntryForm({ ...entryForm, tournament_name: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                  placeholder="e.g., Summer Championship 2025"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Position</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={entryForm.position}
                    onChange={(e) => setEntryForm({ ...entryForm, position: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Prize</label>
                  <input
                    type="text"
                    value={entryForm.prize}
                    onChange={(e) => setEntryForm({ ...entryForm, prize: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                    placeholder="$1,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Score</label>
                  <input
                    type="text"
                    value={entryForm.score}
                    onChange={(e) => setEntryForm({ ...entryForm, score: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                    placeholder="50-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Date Achieved</label>
                <input
                  type="date"
                  required
                  value={entryForm.date_achieved}
                  onChange={(e) => setEntryForm({ ...entryForm, date_achieved: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateEntry(false);
                    setEditingEntry(null);
                    setEntryForm({
                      user_id: '',
                      game_id: '',
                      tournament_name: '',
                      position: 1,
                      prize: '',
                      score: '',
                      date_achieved: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
                >
                  {editingEntry ? 'Update Entry' : 'Add Winner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Game Modal */}
      {showCreateGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gradient-to-br from-purple-900/90 to-black rounded-xl shadow-2xl max-w-md w-full p-6 my-8 border border-purple-500/50">
            <h2 className="text-2xl font-bold text-white mb-6">Add New Game</h2>
            
            <form onSubmit={createGame} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Game Name</label>
                <input
                  type="text"
                  required
                  value={gameForm.name}
                  onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white"
                  placeholder="e.g., FIFA 23"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Description</label>
                <textarea
                  value={gameForm.description}
                  onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white/5 text-white resize-none"
                  placeholder="Brief description of the game..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGame(false);
                    setGameForm({ name: '', description: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
                >
                  Add Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}