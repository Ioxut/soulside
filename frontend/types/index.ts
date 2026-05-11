export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_verified: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface ChatSession {
  id: number;
  title: string;
  started_at: string;
  ended_at: string | null;
  updated_at: string | null;
  message_count: number;
  source_count: number;
  first_message: string | null;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: Array<{ filename: string; page: number | null }>;
}

export interface MoodLog {
  id: number;
  score: number;
  emoji: string;
  notes: string | null;
  logged_date: string;
  created_at: string;
}

export interface ContentItem {
  id: number;
  type: "articol" | "articol_extern" | "video" | "pdf" | "ghid";
  title: string;
  description: string;
  category: string;
  author: string;
  read_time: string;
  url: string | null;
  content: string | null;
  likes: number;
  views: number;
  is_favorited: boolean;
  is_liked: boolean;
  created_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  location: string;
  bio: string;
  photo_url: string | null;
  years_experience: number;
  created_at: string;
}

export interface SpecialistRequest {
  id: number;
  user_id: number;
  name: string;
  email: string;
  message: string;
  preferred_date: string;
  doctor_id: number | null;
  doctor_name: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface SourceDocument {
  id: number;
  filename: string;
  uploaded_at: string;
  chunk_count: number;
}
