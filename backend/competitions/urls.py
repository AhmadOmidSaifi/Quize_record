from django.urls import path
from .views import (
    CompetitionControlAPIView,
    CompetitionDetailAPIView,
    CompetitionLeaderboardAPIView,
    CompetitionListCreateAPIView,
    CompetitionQuestionCreateAPIView,
    CompetitionResultsAPIView,
    CurrentQuestionAPIView,
    JoinCompetitionAPIView,
    QuestionCreateAPIView,
    SubmitAnswerAPIView,
)

urlpatterns = [
    path('competitions/', CompetitionListCreateAPIView.as_view(), name='competition-list-create'),
    path('competitions/join/', JoinCompetitionAPIView.as_view(), name='join-competition'),
    path('questions/', QuestionCreateAPIView.as_view(), name='question-create'),

    # NOTE: these literal-suffix routes must be registered before the
    # generic '<competition_id>/<action>/' control route below, since both
    # shapes match the same two-segment URL ("<id>/<word>/"). Django resolves
    # urlpatterns top-to-bottom and stops at the first match, so if the
    # generic route came first it would swallow these instead.
    path('competitions/<int:competition_id>/questions/', CompetitionQuestionCreateAPIView.as_view(), name='competition-question-create'),
    path('competitions/<int:competition_id>/current-question/', CurrentQuestionAPIView.as_view(), name='current-question'),
    path('competitions/<int:competition_id>/leaderboard/', CompetitionLeaderboardAPIView.as_view(), name='leaderboard'),
    path('competitions/<int:competition_id>/results/', CompetitionResultsAPIView.as_view(), name='results'),
    path('competitions/<int:competition_id>/submit/', SubmitAnswerAPIView.as_view(), name='submit-answer'),

    path('competitions/<int:id>/', CompetitionDetailAPIView.as_view(), name='competition-detail'),
    path('competitions/<int:competition_id>/<str:action>/', CompetitionControlAPIView.as_view(), name='competition-control'),
]
