import { api } from './client'
import {
  Competition,
  CompetitionQuestion,
  CurrentQuestionSnapshot,
  LeaderboardRow,
  Team,
} from './types'

export const listCompetitions = () =>
  api.get<Competition[]>('/api/competitions/', true)

export const getCompetition = (id: number | string) =>
  api.get<Competition>(`/api/competitions/${id}/`, true)

export const createCompetition = (payload: { title: string; description?: string }) =>
  api.post<Competition>('/api/competitions/', payload, true)

export const controlCompetition = (id: number | string, action: 'start' | 'pause' | 'resume' | 'next_question' | 'finish') =>
  api.post<{ status: string; current_question_id?: number }>(`/api/competitions/${id}/${action}/`, undefined, true)

export const listCompetitionQuestions = (id: number | string) =>
  api.get<CompetitionQuestion[]>(`/api/competitions/${id}/questions/`, true)

export interface NewQuestionPayload {
  text: string
  question_type: 'mcq' | 'true_false'
  difficulty: number
  explanation?: string
  points: number
  time_limit_seconds: number
  options: { text: string; is_correct: boolean }[]
}

export const addCompetitionQuestion = (id: number | string, payload: NewQuestionPayload) =>
  api.post(`/api/competitions/${id}/questions/`, payload, true)

export const joinCompetition = (code: string, teamName: string) =>
  api.post<{ competition: Competition; team: Team }>('/api/competitions/join/', { code, team_name: teamName })

export const getCurrentQuestion = (id: number | string) =>
  api.get<CurrentQuestionSnapshot>(`/api/competitions/${id}/current-question/`)

export const getLeaderboard = (id: number | string) =>
  api.get<LeaderboardRow[]>(`/api/competitions/${id}/leaderboard/`)

export const submitAnswer = (id: number | string, teamId: number, selectedOptionId: number) =>
  api.post<{ accepted: boolean; is_correct: boolean; points: number; total_points: number; response_time_ms: number }>(
    `/api/competitions/${id}/submit/`,
    { team_id: teamId, selected_option_id: selectedOptionId }
  )
