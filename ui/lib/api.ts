import { getAuthorizationHeader } from '@/lib/auth'

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export type Country = {
  id: string;
  country_name: string;
  iso_code: string;
  region: string;
};

export type District = {
  id: string;
  country_id: string;
  region_id: string | null;
  district_name: string;
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

export type AdminRoleUpdateRequest = {
  admin_user_id: string;
  role: 'contributor' | 'expert' | 'admin';
};

export type AdminLanguageCapabilityUpdateRequest = {
  admin_user_id: string;
  language_id: string;
  dialect_id?: string | null;
  is_primary_language?: boolean;
  can_record?: boolean;
  can_transcribe?: boolean;
  can_validate?: boolean;
  proficiency_level?: 'native' | 'fluent' | 'intermediate' | 'beginner';
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

export type UserLanguagePreferenceUpdateRequest = {
  language_id: string;
  dialect_id?: string | null;
  is_primary_language: boolean;
  can_record?: boolean;
  can_transcribe?: boolean;
  can_validate?: boolean;
  proficiency_level?: 'native' | 'fluent' | 'intermediate' | 'beginner';
};

export type SubmissionResponse = {
  id: string;
  contributor_id: string;
  language_code: string;
  native_language_code: string;
  target_language_code: string;
  mode: string;
  category: string;
  speaker_profile: string;
  consent_version: string;
  hometown: string | null;
  residence: string | null;
  tribe_ethnicity: string | null;
  gender: string | null;
  age_group: string | null;
  pair_group_id: string | null;
  riddle_part: string | null;
  challenge_submission_id: string | null;
  reveal_submission_id: string | null;
  audio_url: string | null;
  cid: string | null;
  contributor_transcription?: string | null;
  translations?: Array<{
    source_language_code: string;
    target_language_code: string;
    source_text: string;
    translated_text: string;
  }> | null;
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
  native_language_code: string;
  target_language_code: string;
  mode: string;
  category: string;
  speaker_profile: string;
  pair_group_id: string | null;
  riddle_part: string | null;
  challenge_submission_id: string | null;
  reveal_submission_id: string | null;
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

export type RatingHistoryItem = {
  submission_id: string;
  language_code: string;
  mode: string;
  submission_status: string;
  created_at: string;
};

export type TranscriptionQueueItem = {
  id: string;
  recording_id: string;
  user_id: string;
  language_id: string;
  audio_url: string;
  status: string;
  speaker_type: string;
  transcript_count: number;
  validation_count: number;
  eligible_validator_ids: string[];
  eligible_validator_count: number;
  latest_transcription: string | null;
  latest_confidence_score: number | null;
  prompt_text: string | null;
};

export type TranscriptionTaskResponse = {
  id: string;
  recording_id: string;
  transcriber_id: string;
  transcribed_text: string;
  confidence_score: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TranscriptionTaskRequest = {
  recording_id: string;
  transcriber_id: string;
  transcribed_text: string;
  confidence_score?: number | null;
};

export type TranscriptionValidationRequest = {
  transcription_id: string;
  validator_id: string;
  rating: number;
  is_correct: boolean;
  suggested_correction?: string | null;
  comments?: string | null;
  deep_cultural_meaning?: string | null;
};

export type TranscriptionValidationResponse = {
  id: string;
  transcription_id: string;
  validator_id: string;
  rating: number;
  is_correct: boolean;
  suggested_correction: string | null;
  comments: string | null;
  created_at: string;
};

export type PromptBankEntry = {
  id: string;
  language_id: string;
  dialect_id: string | null;
  sentence_text: string;
  domain: string;
  source_type: string;
  is_verified: boolean;
  created_by: string | null;
  created_at: string;
};

export type ImagePromptEntry = {
  id: string;
  image_url: string;
  instruction_text: string;
  is_active: boolean;
};

export type TranslationQueueItem = {
  transcription_id: string;
  recording_id: string;
  source_language_id: string;
  transcribed_text: string;
  translation_count: number;
  latest_translation: string | null;
};

export type TranslationTaskRequest = {
  transcription_id: string;
  translator_id: string;
  target_language_code: string;
  translated_text: string;
};

export type TranslationTaskResponse = {
  id: string;
  transcription_id: string;
  translator_id: string;
  target_language_code: string;
  translated_text: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SourceTranslationQueueItem = {
  id: string;
  source_sentence_id: string;
  source_text: string;
  source_language_id: string;
  target_language_id: string;
  target_language_code: string;
  target_language_name: string;
  machine_prefill_text: string | null;
  prefill_provider: string | null;
  prefill_confidence: number | null;
  translated_text: string | null;
  reviewed_text: string | null;
  validation_count: number;
  approval_count: number;
  status: string;
  updated_at: string;
};

export type SourceTranslationSubmitRequest = {
  translator_id: string;
  translated_text: string;
};

export type SourceTranslationReviewRequest = {
  reviewer_id: string;
  approved: boolean;
  reviewed_text?: string | null;
  notes?: string | null;
};

export type SourceTranslationValidationRequest = {
  validator_id: string;
  is_valid: boolean;
  notes?: string | null;
};

export type SubmissionCreateRequest = {
  contributor_id: string;
  language_code: string;
  native_language_code: string;
  target_language_code: string;
  mode: 'prompted' | 'recording' | 'read_out' | 'spontaneous_image';
  category: 'proverb' | 'idiom' | 'common_saying' | 'riddle' | 'photo_description';
  speaker_profile: string;
  consent_version: string;
  hometown?: string | null;
  residence?: string | null;
  tribe_ethnicity?: string | null;
  gender?: string | null;
  age_group?: string | null;
  pair_group_id?: string | null;
  riddle_part?: 'challenge' | 'reveal' | null;
  challenge_submission_id?: string | null;
  reveal_submission_id?: string | null;
  audio_url?: string | null;
  cid?: string | null;
  contributor_transcription?: string | null;
  translations?: Array<{
    source_language_code: string;
    target_language_code: string;
    source_text: string;
    translated_text: string;
  }> | null;
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

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
      ...options?.headers,
    },
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payload.detail ?? `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function getUserById(userId: string): Promise<UserResponse> {
  return fetchJson<UserResponse>(`/auth/users/${userId}`);
}

export function listUsersForAdmin(adminUserId: string): Promise<UserResponse[]> {
  return fetchJson<UserResponse[]>(`/auth/admin/users?admin_user_id=${encodeURIComponent(adminUserId)}`)
}

export async function updateUserById(userId: string, payload: UserUpdateRequest): Promise<UserResponse> {
  return fetchJson<UserResponse>(`/auth/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function adminUpdateUserRole(userId: string, payload: AdminRoleUpdateRequest): Promise<UserResponse> {
  return fetchJson<UserResponse>(`/auth/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function adminUpdateUserLanguageCapabilities(
  userId: string,
  payload: AdminLanguageCapabilityUpdateRequest,
): Promise<UserLanguagePreferenceResponse> {
  return fetchJson<UserLanguagePreferenceResponse>(`/auth/admin/users/${userId}/language-preferences`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getUserProfileById(userId: string): Promise<UserProfileResponse> {
  return fetchJson<UserProfileResponse>(`/auth/users/${userId}/profile`);
}

export async function updateUserProfileById(userId: string, payload: UserProfileUpdateRequest): Promise<UserProfileResponse> {
  return fetchJson<UserProfileResponse>(`/auth/users/${userId}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getUserWalletById(userId: string): Promise<WalletResponse> {
  return fetchJson<WalletResponse>(`/auth/users/${userId}/wallet`);
}

export function getUserLanguagePreferencesById(userId: string): Promise<UserLanguagePreferenceResponse[]> {
  return fetchJson<UserLanguagePreferenceResponse[]>(`/auth/users/${userId}/language-preferences`);
}

export async function updateUserLanguagePreferencesById(
  userId: string,
  preferences: UserLanguagePreferenceUpdateRequest[],
): Promise<UserLanguagePreferenceResponse[]> {
  return fetchJson<UserLanguagePreferenceResponse[]>(`/auth/users/${userId}/language-preferences`, {
    method: 'PUT',
    body: JSON.stringify({ language_preferences: preferences }),
  })
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

export function getSubmissions(): Promise<SubmissionResponse[]> {
  return fetchJson<SubmissionResponse[]>(`/submissions`);
}

export function getRatingsByUser(raterId: string): Promise<RatingHistoryItem[]> {
  return fetchJson<RatingHistoryItem[]>(`/submissions/ratings/by/${encodeURIComponent(raterId)}`);
}

export async function createSubmission(payload: SubmissionCreateRequest): Promise<SubmissionResponse> {
  const response = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(payload.cid ? { 'X-Idempotency-Key': payload.cid } : {}),
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

export function getTranscriptionQueue(): Promise<TranscriptionQueueItem[]> {
  return fetchJson<TranscriptionQueueItem[]>(`/transcription/queue`)
}

export async function upsertTranscriptionTask(payload: TranscriptionTaskRequest): Promise<TranscriptionTaskResponse> {
  const response = await fetch(`${API_BASE}/transcription/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const payloadBody = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payloadBody.detail ?? 'Transcription submission failed')
  }

  return response.json() as Promise<TranscriptionTaskResponse>
}

export async function createTranscriptionValidation(
  taskId: string,
  payload: TranscriptionValidationRequest,
): Promise<TranscriptionValidationResponse> {
  const response = await fetch(`${API_BASE}/transcription/tasks/${taskId}/validations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const payloadBody = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payloadBody.detail ?? 'Transcription validation failed')
  }

  return response.json() as Promise<TranscriptionValidationResponse>
}

export async function graduateTranscriptionTask(taskId: string, expertId: string): Promise<PromptBankEntry> {
  const response = await fetch(`${API_BASE}/transcription/tasks/${taskId}/graduate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expert_id: expertId }),
  })

  if (!response.ok) {
    const payloadBody = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payloadBody.detail ?? 'Prompt graduation failed')
  }

  return response.json() as Promise<PromptBankEntry>
}

export function getPromptBank(languageId?: string, limit = 200, offset = 0): Promise<PromptBankEntry[]> {
  const params = new URLSearchParams()
  if (languageId) {
    params.set('language_id', languageId)
  }
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return fetchJson<Array<Partial<PromptBankEntry> & Record<string, unknown>>>(`/transcription/prompt-bank?${params.toString()}`)
    .then((items) =>
      items
        .map((item) => {
          const sentenceText =
            typeof item.sentence_text === 'string'
              ? item.sentence_text
              : typeof item.text === 'string'
                ? item.text
                : ''

          if (!item.id || !item.language_id || !sentenceText) {
            return null
          }

          return {
            id: String(item.id),
            language_id: String(item.language_id),
            dialect_id: typeof item.dialect_id === 'string' ? item.dialect_id : null,
            sentence_text: sentenceText,
            domain: typeof item.domain === 'string' ? item.domain : 'general',
            source_type: typeof item.source_type === 'string' ? item.source_type : 'prompt_bank',
            is_verified: item.is_verified !== false,
            created_by: typeof item.created_by === 'string' ? item.created_by : null,
            created_at: typeof item.created_at === 'string' ? item.created_at : new Date().toISOString(),
          } satisfies PromptBankEntry
        })
        .filter((item): item is PromptBankEntry => item !== null),
    )
}

export function getImagePrompts(): Promise<ImagePromptEntry[]> {
  return fetchJson<ImagePromptEntry[]>(`/transcription/image-prompts`)
}

export function getTranslationQueue(): Promise<TranslationQueueItem[]> {
  return fetchJson<TranslationQueueItem[]>(`/transcription/translation-queue`)
}

export async function createOrUpdateTranslationTask(
  taskId: string,
  payload: TranslationTaskRequest,
): Promise<TranslationTaskResponse> {
  const response = await fetch(`${API_BASE}/transcription/tasks/${taskId}/translations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const payloadBody = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payloadBody.detail ?? 'Translation submission failed')
  }

  return response.json() as Promise<TranslationTaskResponse>
}

export function getSourceTranslationQueue(
  targetLanguageId: string,
  status: 'queued' | 'prefilled' | 'submitted' | 'in_validation' | 'validated' | 'approved' | 'rejected' = 'prefilled',
  limit = 200,
  offset = 0,
): Promise<SourceTranslationQueueItem[]> {
  const params = new URLSearchParams()
  params.set('target_language_id', targetLanguageId)
  params.set('status', status)
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return fetchJson<Array<Partial<SourceTranslationQueueItem> & Record<string, unknown>>>(
    `/transcription/source-translation-queue?${params.toString()}`,
  ).then((items) =>
    items
      .map((item) => {
        const sourceText =
          typeof item.source_text === 'string'
            ? item.source_text
            : typeof item.source_sentence_text === 'string'
              ? item.source_sentence_text
              : typeof item.sentence_text === 'string'
                ? item.sentence_text
                : ''

        if (!item.id || !item.source_sentence_id || !item.target_language_id) {
          return null
        }

        return {
          id: String(item.id),
          source_sentence_id: String(item.source_sentence_id),
          source_text: sourceText,
          source_language_id: typeof item.source_language_id === 'string' ? item.source_language_id : '',
          target_language_id: String(item.target_language_id),
          target_language_code: typeof item.target_language_code === 'string' ? item.target_language_code : '',
          target_language_name: typeof item.target_language_name === 'string' ? item.target_language_name : '',
          machine_prefill_text: typeof item.machine_prefill_text === 'string' ? item.machine_prefill_text : null,
          prefill_provider: typeof item.prefill_provider === 'string' ? item.prefill_provider : null,
          prefill_confidence: typeof item.prefill_confidence === 'number' ? item.prefill_confidence : null,
          translated_text: typeof item.translated_text === 'string' ? item.translated_text : null,
          reviewed_text: typeof item.reviewed_text === 'string' ? item.reviewed_text : null,
          validation_count: typeof item.validation_count === 'number' ? item.validation_count : 0,
          approval_count: typeof item.approval_count === 'number' ? item.approval_count : 0,
          status: typeof item.status === 'string' ? item.status : 'queued',
          updated_at: typeof item.updated_at === 'string' ? item.updated_at : new Date().toISOString(),
        } satisfies SourceTranslationQueueItem
      })
      .filter((item): item is SourceTranslationQueueItem => item !== null),
  )
}

export async function validateSourceTranslation(
  taskId: string,
  payload: SourceTranslationValidationRequest,
): Promise<SourceTranslationQueueItem> {
  return fetchJson<SourceTranslationQueueItem>(`/transcription/source-translations/${taskId}/validations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function submitSourceTranslation(
  taskId: string,
  payload: SourceTranslationSubmitRequest,
): Promise<SourceTranslationQueueItem> {
  return fetchJson<SourceTranslationQueueItem>(`/transcription/source-translations/${taskId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function reviewSourceTranslation(
  taskId: string,
  payload: SourceTranslationReviewRequest,
): Promise<SourceTranslationQueueItem> {
  return fetchJson<SourceTranslationQueueItem>(`/transcription/source-translations/${taskId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
