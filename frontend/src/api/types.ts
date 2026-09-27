export type CompetitionStatus = 'draft' | 'waiting' | 'running' | 'paused' | 'finished'

export interface Competition {
  id: number
  code: string
  title: string
  description: string
  status: CompetitionStatus
  settings: Record<string, any>
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface QuestionOption {
  id: number
  text: string
  is_correct: boolean
  order: number
}

export interface Question {
  id: number
  text: string
  question_type: 'mcq' | 'true_false'
  difficulty: number
  explanation: string
  image_url: string | null
  options: QuestionOption[]
  created_by?: number | null
  created_at?: string
}

export interface CompetitionQuestion {
  id: number
  order: number
  points: number
  time_limit_seconds: number
  is_current: boolean
  question: Question
}

export interface Team {
  id: number
  competition: number
  name: string
  created_at: string
}

export interface LeaderboardRow {
  rank: number
  team_id: number
  team_name: string
  total_points: number
  correct_count: number
  average_response_ms: number
}

export interface PublicOption {
  id: number
  text: string
  order: number
}

export interface PublicCurrentQuestion {
  id: number
  order: number
  points: number
  time_limit_seconds: number
  question: {
    id: number
    text: string
    question_type: 'mcq' | 'true_false'
    image_url: string | null
    options: PublicOption[]
  }
}

export interface CurrentQuestionSnapshot {
  competition_code: string
  status: CompetitionStatus
  server_time: string
  current_question_started_at: string | null
  current_question: PublicCurrentQuestion | null
}
