'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Group } from '@/lib/supabase/types';
import ChatWindow from '@/components/ChatWindow';
import CreateGroupModal from '@/components/CreateGroupModal';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'all-groups'>('my-groups');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      // Fetch all public groups
      const { data: allGroups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch user's group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user?.id);

      if (membershipsError) throw membershipsError;

      const memberGroupIds = new Set(memberships?.map((m: { group_id: string }) => m.group_id) || []);
      
      const userGroups = allGroups?.filter((g: Group) => memberGroupIds.has(g.id)) || [];
      
      setMyGroups(userGroups);
      setGroups(allGroups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user?.id,
        });

      if (error) throw error;
      
      await fetchGroups();
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError.code !== '23505') { // Ignore duplicate key error
        console.error('Error joining group:', error);
      }
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      
      await fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  const displayGroups = activeTab === 'my-groups' ? myGroups : groups;
  const isMember = (groupId: string) => myGroups.some((g: Group) => g.id === groupId);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-900">
      {/* Sidebar */}
      <div className={`${selectedGroup ? 'hidden md:block' : 'block'} w-full md:w-80 bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Community
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
            >
              Create Group
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                activeTab === 'my-groups'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              My Groups
            </button>
            <button
              onClick={() => setActiveTab('all-groups')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                activeTab === 'all-groups'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              All Groups
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
            </div>
          ) : displayGroups.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                {activeTab === 'my-groups'
                  ? 'You haven\'t joined any groups yet'
                  : 'No groups available'}
              </p>
            </div>
          ) : (
            displayGroups.map((group: Group) => (
              <div
                key={group.id}
                className={`p-4 border-b border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition ${
                  selectedGroup?.id === group.id ? 'bg-zinc-100 dark:bg-zinc-700' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => isMember(group.id) && setSelectedGroup(group)}>
                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {isMember(group.id) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          leaveGroup(group.id);
                        }}
                        className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinGroup(group.id);
                        }}
                        className="px-3 py-1 text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedGroup ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
        {selectedGroup ? (
          <ChatWindow
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
            <div className="text-center">
              <p className="text-xl text-zinc-600 dark:text-zinc-400">
                Select a group to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchGroups}
        />
      )}
    </div>
  );
}