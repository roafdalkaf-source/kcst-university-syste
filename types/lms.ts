export type LessonType   = 'video' | 'document' | 'text' | 'scorm' | 'youtube';
export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned';
export type ProgressStatus   = 'not_started' | 'in_progress' | 'completed';
export type AttemptStatus    = 'in_progress' | 'submitted' | 'graded' | 'expired';
export type LiveStatus       = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type QuestionType     = 'mcq' | 'true_false' | 'short_answer' | 'essay' | 'matching';

export interface LmsLesson {
  id:                 string;
  section_id:         string;
  title:              string;
  title_ar?:          string | null;
  type:               LessonType;
  order_index:        number;
  video_url?:         string | null;
  youtube_id?:        string | null;
  file_url?:          string | null;
  file_name?:         string | null;
  content?:           string | null;
  video_duration_sec: number;
  is_preview:         boolean;
  is_published:       boolean;
  created_at:         string;
}

export interface LmsProgress {
  id:             string;
  enrollment_id:  string;
  lesson_id:      string;
  status:         ProgressStatus;
  watched_seconds:number;
  last_position:  number;
  completed_at?:  string | null;
}

export interface LmsSubmission {
  id:            string;
  assignment_id: string;
  enrollment_id: string;
  text_content?: string | null;
  file_url?:     string | null;
  file_name?:    string | null;
  external_url?: string | null;
  submitted_at:  string;
  is_late:       boolean;
  score?:        number | null;
  feedback?:     string | null;
  status:        SubmissionStatus;
}

export interface LmsQuizAttempt {
  id:             string;
  quiz_id:        string;
  enrollment_id:  string;
  attempt_number: number;
  started_at:     string;
  submitted_at?:  string | null;
  score?:         number | null;
  percentage?:    number | null;
  passed?:        boolean | null;
  status:         AttemptStatus;
  answers:        any[];
}
