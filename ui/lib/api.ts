export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export type Country = {
  id: string;
  country_name: string;
  iso_code: string;
  region: string;
};

export type Language = {
  id: string;
  language_name: string;
  iso_code: string;
  country_id: string | null;
  is_low_resource: boolean;
};

export type ConsentDocument = {
  id: string;
  title: string;
  document_type: string;
  version: string;
  document_url: string;
  is_active: boolean;
};

export type SpeechCondition = {
  id: string;
  condition_name: string;
  description: string;
  research_notes: string | null;
};

export type UserResponse = {
  id: string;
  full_name: string;
  email: string;
  onboarding_completed: boolean;
  role: string;
};

export type UserUpdateRequest = {
  full_name?: string;
  email?: string;
  onboarding_completed?: boolean;
};

export type UserProfileResponse = {
  id: string;
  user_id: string;
  country: string;
  primary_language: string;
  preferred_contribution_type: string;
  has_speech_impairment: boolean;
  impairment_type: string | null;
  can_read_sentences: boolean;
  bio: string | null;
};

export type UserProfileUpdateRequest = {
  country?: string;
  primary_language?: string;
  preferred_contribution_type?: 'recording' | 'validation' | 'transcription';
  has_speech_impairment?: boolean;
  impairment_type?: string | null;
  can_read_sentences?: boolean;
  bio?: string | null;
};

export type WalletResponse = {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
};

export type UserLanguagePreferenceResponse = {
  id: string;
  user_id: string;
  language_id: string;
  dialect_id: string | null;
  is_primary_language: boolean;
  can_record: boolean;
  can_transcribe: boolean;
  can_validate: boolean;
  proficiency_level: string;
};

export type SubmissionResponse = {
  id: string;
  contributor_id: string;
  language_code: string;
  mode: string;
  speaker_profile: string;
  consent_version: string;
  audio_url: string | null;
  cid: string | null;
  target_word: string | null;
  read_prompt: string | null;
  image_prompt_url: string | null;
  spontaneous_instruction: string | null;
  status: string;
  aggregate_score: number | null;
  created_at: string;
};

export type CommunityQueueItem = {
  id: string;
  contributor_id: string;
  language_code: string;
  mode: string;
  speaker_profile: string;
  target_word: string | null;
  read_prompt: string | null;
  image_prompt_url: string | null;
  spontaneous_instruction: string | null;
  audio_url: string | null;
  status: string;
  ratings_count: number;
};

export type RatingResult = {
  submission_id: string;
  status: string;
  aggregate_score: number | null;
  ratings_count: number;
  reason: string;
};

export type SubmissionCreateRequest = {
  contributor_id: string;
  language_code: string;
  mode: 'prompted' | 'recording' | 'read_out' | 'spontaneous_image';
  speaker_profile: string;
  consent_version: string;
  audio_url?: string | null;
  cid?: string | null;
  target_word?: string | null;
  read_prompt?: string | null;
  image_prompt_url?: string | null;
  spontaneous_instruction?: string | null;
};

export type RatingCreateRequest = {
  submission_id: string;
  rater_id: string;
  intelligibility: number;
  recording_quality: number;
  elicitation_compliance: number;
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(payload.detail ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getUserById(userId: string): Promise<UserResponse> {
  return fetchJson<UserResponse>(`/auth/users/${userId}`);
}

export async function updateUserById(userId: string, payload: UserUpdateRequest): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const payloadBody = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payloadBody.detail ?? 'User update failed')
  }

  return response.json() as Promise<UserResponse>
}

export function getUserProfileById(userId: string): Promise<UserProfileResponse> {
  return fetchJson<UserProfileResponse>(`/auth/users/${userId}/profile`);
}

export async function updateUserProfileById(userId: string, payload: UserProfileUpdateRequest): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE}/auth/users/${userId}/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const payloadBody = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payloadBody.detail ?? 'Profile update failed')
  }

  return response.json() as Promise<UserProfileResponse>
}

export function getUserWalletById(userId: string): Promise<WalletResponse> {
  return fetchJson<WalletResponse>(`/auth/users/${userId}/wallet`);
}

export function getUserLanguagePreferencesById(userId: string): Promise<UserLanguagePreferenceResponse[]> {
  return fetchJson<UserLanguagePreferenceResponse[]>(`/auth/users/${userId}/language-preferences`);
}

export function getConsentDocuments(): Promise<ConsentDocument[]> {
  return fetchJson<ConsentDocument[]>(`/auth/consent-documents`);
}

export function getSpeechConditions(): Promise<SpeechCondition[]> {
  return fetchJson<SpeechCondition[]>(`/auth/speech-conditions`);
}

export function getLanguages(countryId?: string): Promise<Language[]> {
  const query = countryId ? `?country_id=${encodeURIComponent(countryId)}` : '';
  return fetchJson<Language[]>(`/auth/languages${query}`);
}

export function getCommunityQueue(): Promise<CommunityQueueItem[]> {
  return fetchJson<CommunityQueueItem[]>(`/submissions/queue`);
}

export async function createSubmission(payload: SubmissionCreateRequest): Promise<SubmissionResponse> {
  const response = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const payloadBody = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payloadBody.detail ?? 'Submission failed')
  }

  return response.json() as Promise<SubmissionResponse>
}

export async function createCommunityRating(submissionId: string, payload: RatingCreateRequest): Promise<RatingResult> {
  const response = await fetch(`${API_BASE}/submissions/${submissionId}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const payloadBody = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payloadBody.detail ?? 'Rating failed')
  }

  return response.json() as Promise<RatingResult>
}
