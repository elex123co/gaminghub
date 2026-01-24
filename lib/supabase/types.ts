export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  role: UserRole;
  country: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandingContent {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
}

export interface Game {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id: string;
  tournament_name: string;
  position: number;
  prize: string | null;
  score: string | null;
  date_achieved: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
  game?: Game;
}