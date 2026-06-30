/* Database types - mirrors Supabase schema */

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: { lat: number; lng: number; city: string; country: string } | null;
  interests: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  follower_count?: number;
  following_count?: number;
}

export interface Orbit {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  about: string | null;
  logo_url: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[];
  is_private: boolean;
  is_college: boolean;
  college_name: string | null;
  location: { lat: number; lng: number; city: string; country: string } | null;
  created_by: string;
  member_count: number;
  post_count: number;
  social_links: Record<string, string>;
  policies: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: Profile;
  is_member?: boolean;
  user_role?: OrbitRole;
}

export type OrbitRole = "owner" | "admin" | "moderator" | "member" | "requested";

export interface OrbitMember {
  id: string;
  orbit_id: string;
  user_id: string;
  role: OrbitRole;
  joined_at: string;
  profile?: Profile;
}

export interface Post {
  id: string;
  orbit_id: string;
  author_id: string;
  content: string | null;
  media_urls: string[];
  media_type: "text" | "image" | "video" | "poll" | "reel";
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  orbit?: Orbit;
  is_liked?: boolean;
  poll?: Poll;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  created_at: string;
  author?: Profile;
  replies?: Comment[];
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Channel {
  id: string;
  orbit_id: string | null;
  name: string | null;
  type: "dm" | "group" | "orbit_channel";
  created_by: string;
  created_at: string;
  // Joined
  members?: ChannelMember[];
  last_message?: Message;
  unread_count?: number;
}

export interface ChannelMember {
  channel_id: string;
  user_id: string;
  last_read_at: string | null;
  profile?: Profile;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface OrbitEvent {
  id: string;
  orbit_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  location: { lat: number; lng: number; city: string; country: string } | null;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
  attendee_count: number;
  created_at: string;
  orbit?: Orbit;
  creator?: Profile;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  caption: string | null;
  expires_at: string;
  created_at: string;
  profiles?: Profile;
}

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  options: PollOption[];
  ends_at: string | null;
  created_at: string;
  user_vote?: number;
}

export interface PollOption {
  text: string;
  votes: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  orbit_id: string;
  title: string;
  description: string | null;
  type: "photo" | "video" | "text" | "location";
  cover_url: string | null;
  location: Record<string, unknown> | null;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
  participant_count: number;
  created_at: string;
  creator?: Profile;
}

export interface TreasureHunt {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
  is_active: boolean;
  participant_count: number;
  created_at: string;
  creator?: Profile;
}

export interface Riddle {
  id: string;
  treasure_hunt_id: string;
  content: string;
  hint: string | null;
  level: number;
  answer_type: "code" | "location";
  answer: string;
  lat: number | null;
  lng: number | null;
  max_score: number;
  created_at: string;
}

export interface TreasureHuntParticipant {
  id: string;
  treasure_hunt_id: string;
  user_id: string;
  current_level: number;
  score: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}
