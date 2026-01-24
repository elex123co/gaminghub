'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Group, Profile } from '@/lib/supabase/types';
import ChatWindow from '@/components/ChatWindow';
import CreateGroupModal from '@/components/CreateGroupModal';
import DirectMessageWindow from '@/components/DirectMessageWindow';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'all-groups' | 'direct-messages'>('my-groups');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchUsers();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data: allGroups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .order('username');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      if (dbError.code !== '23505') {
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const displayGroups = activeTab === 'my-groups' ? myGroups : groups;
  const isMember = (groupId: string) => myGroups.some((g: Group) => g.id === groupId);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-black">
      {/* Sidebar */}
      <div className={`${selectedGroup || selectedUser ? 'hidden md:block' : 'block'} w-full md:w-80 bg-gradient-to-b from-purple-950/50 to-black border-r border-purple-500/30 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-purple-500/30 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Community Hub
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
            >
              Create Group
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('my-groups');
                setSelectedUser(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition ${
                activeTab === 'my-groups'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              My Groups
            </button>
            <button
              onClick={() => {
                setActiveTab('all-groups');
                setSelectedUser(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition ${
                activeTab === 'all-groups'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              All Groups
            </button>
            <button
              onClick={() => {
                setActiveTab('direct-messages');
                setSelectedGroup(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition ${
                activeTab === 'direct-messages'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              DMs
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : activeTab === 'direct-messages' ? (
            // Direct Messages List
            users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              users.map((userProfile: Profile) => (
                <div
                  key={userProfile.id}
                  onClick={() => {
                    setSelectedUser(userProfile);
                    setSelectedGroup(null);
                  }}
                  className={`p-4 border-b border-purple-500/20 cursor-pointer hover:bg-purple-900/30 transition ${
                    selectedUser?.id === userProfile.id ? 'bg-purple-900/50 border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">
                        {userProfile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {userProfile.username}
                      </h3>
                      <p className="text-xs text-gray-400">Click to message</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                  </div>
                </div>
              ))
            )
          ) : displayGroups.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">
                {activeTab === 'my-groups'
                  ? 'You haven\'t joined any groups yet'
                  : 'No groups available'}
              </p>
            </div>
          ) : (
            // Groups List
            displayGroups.map((group: Group) => (
              <div
                key={group.id}
                className={`p-4 border-b border-purple-500/20 cursor-pointer hover:bg-purple-900/30 transition ${
                  selectedGroup?.id === group.id ? 'bg-purple-900/50 border-l-4 border-l-purple-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold text-white">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => isMember(group.id) && setSelectedGroup(group)}>
                    <h3 className="font-semibold text-white truncate">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-400 truncate">
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
                        className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition border border-red-500/50"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinGroup(group.id);
                        }}
                        className="px-3 py-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
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
      <div className={`${selectedGroup || selectedUser ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
        {selectedGroup ? (
          <ChatWindow
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        ) : selectedUser ? (
          <DirectMessageWindow
            recipient={selectedUser}
            onBack={() => setSelectedUser(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-black via-purple-950/20 to-black">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-pulse">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <p className="text-xl text-gray-300 mb-2">
                Select a group or user to start chatting
              </p>
              <p className="text-sm text-gray-500">
                Join groups to connect with the community or send direct messages
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