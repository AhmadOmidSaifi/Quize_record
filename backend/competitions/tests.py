from django.test import TestCase
from .models import Competition, Question, QuestionOption, Team, CompetitionQuestion, TeamScore, AnswerSubmission
from .services.scoring import compute_points


class ScoringTests(TestCase):
    def test_compute_points_for_correct_answer(self):
        points = compute_points(correct=True, response_time_seconds=5, time_limit_seconds=30, difficulty=2, base_points=100)
        self.assertGreater(points, 100)

    def test_compute_points_for_incorrect_answer(self):
        points = compute_points(correct=False, response_time_seconds=5, time_limit_seconds=30, difficulty=2, base_points=100)
        self.assertEqual(points, 0)

    def test_duplicate_submission_constraint(self):
        competition = Competition.objects.create(code='ABC12345', title='Test Competition')
        question = Question.objects.create(text='Q1', question_type='mcq')
        option = QuestionOption.objects.create(question=question, text='A', is_correct=True)
        cq = CompetitionQuestion.objects.create(competition=competition, question=question, order=1, points=100, time_limit_seconds=30)
        team = Team.objects.create(competition=competition, name='Alpha')
        AnswerSubmission.objects.create(competition=competition, competition_question=cq, team=team, selected_option=option, is_correct=True, response_time_ms=1000)
        duplicate = AnswerSubmission.objects.filter(competition_question=cq, team=team).count()
        self.assertEqual(duplicate, 1)
