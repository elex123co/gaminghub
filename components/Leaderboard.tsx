'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { LeaderboardEntry, Game } from '@/lib/supabase/types';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, gamesRes] = await Promise.all([
        supabase
          .from('leaderboard_entries')
          .select(`
            *,
            user:profiles(*),
            game:games(*)
          `)
          .order('position', { ascending: true })
          .order('date_achieved', { ascending: false }),
        supabase.from('games').select('*').order('name'),
      ]);

      if (entriesRes.error) throw entriesRes.error;
      if (gamesRes.error) throw gamesRes.error;

      setEntries(entriesRes.data || []);
      setGames(gamesRes.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = selectedGame === 'all'
    ? entries
    : entries.filter(entry => entry.game_id === selectedGame);

  const topWinners = filteredEntries.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedGame('all')}
          className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            selectedGame === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-purple-500/30'
          }`}
        >
          All Games
        </button>
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              selectedGame === game.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-purple-500/30'
            }`}
          >
            {game.name}
          </button>
        ))}
      </div>

      {/* Leaderboard Entries */}
      {topWinners.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 text-center border border-purple-500/30">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-xl text-gray-400">No champions yet in this category</p>
          <p className="text-sm text-gray-500 mt-2">Check back soon for tournament results!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topWinners.map((entry, index) => {
            const isTop3 = entry.position <= 3;
            const medalColor = 
              entry.position === 1 ? 'from-yellow-400 to-yellow-600' :
              entry.position === 2 ? 'from-gray-300 to-gray-500' :
              entry.position === 3 ? 'from-orange-500 to-orange-700' :
              'from-purple-500 to-pink-600';

            return (
              <div
                key={entry.id}
                className={`bg-gradient-to-br ${
                  isTop3 ? 'from-purple-900/70 to-pink-900/70 border-2' : 'from-white/5 to-white/5 border'
                } backdrop-blur-sm rounded-xl p-6 border-purple-500/30 hover:border-purple-500 transition transform hover:scale-[1.02] ${
                  isTop3 ? 'shadow-xl shadow-purple-500/30' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Position Badge */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${medalColor} flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-lg ${
                    isTop3 ? 'ring-4 ring-purple-500/50' : ''
                  }`}>
                    {isTop3 ? (
                      <span className="text-white">🏆</span>
                    ) : (
                      <span className="text-white">#{entry.position}</span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white truncate">
                        {entry.user?.username}
                      </h3>
                      {entry.user?.country && (
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/50">
                          {entry.user.country}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-purple-300 mb-2">
                      {entry.game?.name} • {entry.tournament_name}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      {entry.prize && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Prize:</span>
                          <span className="text-white font-semibold">{entry.prize}</span>
                        </div>
                      )}
                      {entry.score && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Score:</span>
                          <span className="text-white font-semibold">{entry.score}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white font-semibold">
                          {new Date(entry.date_achieved).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Position Number for Top 3 */}
                  {isTop3 && (
                    <div className="hidden md:block text-6xl font-bold opacity-10">
                      #{entry.position}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {filteredEntries.length > 10 && (
        <div className="mt-6 text-center">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50">
            View All {filteredEntries.length} Winners
          </button>
        </div>
      )}
    </div>
  );
}