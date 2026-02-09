export interface AuthPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: string;
}

export interface WordRoot {
  id?: number;
  cn_name: string;
  en_abbr: string;
  en_full_name?: string;
  associated_terms?: string;
  remark?: string;
  created_at?: string;
  score?: number;
}

export interface Segment {
  word: string;
  candidates: WordRoot[];
}

export interface SuggestResponse {
  segments: Segment[];
}

export interface StandardField {
  id?: number;
  field_cn_name: string;
  field_en_name: string;
  composition_ids: number[];
  data_type: string;
  associated_terms?: string;
  is_standard: boolean;
  created_at?: string;
  score?: number;
}