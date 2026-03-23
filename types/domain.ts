export type UserRole = 'guardian' | 'center_admin' | 'demo_admin';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';
export type ConsultationStatus = 'pending' | 'contacted' | 'closed';
export type PostVisibility = 'public' | 'guardians' | 'staff';

export type Center = {
  id: number;
  source_org_code: string | null;
  name: string;
  address: string | null;
  region_text: string | null;
  source_type_code: string | null;
  type_name: string | null;
  capacity_total: number | null;
  capacity_current: number | null;
  rating_grade: string | null;
  rating_total_score: number | null;
  staff_social_worker: number | null;
  staff_caregiver: number | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  city: string | null;
  district: string | null;
  town: string | null;
  intro_text: string | null;
  homepage_url: string | null;
  hero_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  role: UserRole;
  center_id: number | null;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: number;
  center_id: number;
  author_id: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  visibility: PostVisibility;
  created_at: string;
  centers?: Pick<Center, 'id' | 'name' | 'region_text'> | null;
  profiles?: Pick<Profile, 'id' | 'display_name' | 'role'> | null;
};

export type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, 'display_name'> | null;
};

export type Claim = {
  id: number;
  center_id: number;
  user_id: string;
  message: string | null;
  status: ClaimStatus;
  created_at: string;
  centers?: Pick<Center, 'id' | 'name' | 'region_text'> | null;
  profiles?: Pick<Profile, 'id' | 'display_name' | 'email' | 'phone'> | null;
};

export type ConsultationRequest = {
  id: number;
  center_id: number;
  guardian_name: string;
  phone: string;
  patient_relation: string | null;
  message: string | null;
  status: ConsultationStatus;
  created_at: string;
};

export type Viewport = {
  south: number;
  north: number;
  west: number;
  east: number;
};
