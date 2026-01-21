export interface WordRoot {
  id?: number;
  cn_name: string;
  en_abbr: string;
  associated_terms?: string;
  remark?: string;
  created_at?: string;
}

export interface SuggestResponse {
  suggested_en: string;
  missing_words: string[];
}

export interface StandardField {
  id?: number;
  field_cn_name: string;
  field_en_name: string;
  composition_ids: number[];
  data_type: string;
  is_standard: boolean;
  created_at?: string;
}