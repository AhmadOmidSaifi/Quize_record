from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AnswerSubmission,
    Competition,
    CompetitionQuestion,
    Question,
    QuestionOption,
    Team,
    TeamScore,
)
from .serializers import CompetitionSerializer, QuestionSerializer, TeamSerializer
from .services.scoring import compute_points
from .services.live_state import broadcast_event


class CompetitionListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = CompetitionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Competition.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, status='waiting')


class CompetitionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CompetitionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Competition.objects.all()
    lookup_field = 'id'


class QuestionCreateAPIView(generics.CreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CompetitionQuestionCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, competition_id):
        competition = get_object_or_404(Competition, id=competition_id)
        competition_questions = (
            competition.competition_questions
            .select_related('question')
            .prefetch_related('question__options')
            .order_by('order')
        )
        data = [
            {
                'id': cq.id,
                'order': cq.order,
                'points': cq.points,
                'time_limit_seconds': cq.time_limit_seconds,
                'is_current': competition.current_question_id == cq.id,
                'question': QuestionSerializer(cq.question).data,
            }
            for cq in competition_questions
        ]
        return Response(data)

    def post(self, request, competition_id):
        competition = get_object_or_404(Competition, id=competition_id)
        question = Question.objects.create(
            text=request.data.get('text', '').strip(),
            question_type=request.data.get('question_type', 'mcq'),
            difficulty=request.data.get('difficulty', 2),
            explanation=request.data.get('explanation', ''),
            image_url=request.data.get('image_url'),
            created_by=request.user,
        )

        for index, option in enumerate(request.data.get('options', [])):
            QuestionOption.objects.create(
                question=question,
                text=str(option.get('text', '')).strip(),
                is_correct=bool(option.get('is_correct', False)),
                order=index,
            )

        competition_question = CompetitionQuestion.objects.create(
            competition=competition,
            question=question,
            order=competition.competition_questions.count(),
            points=request.data.get('points', 100),
            time_limit_seconds=request.data.get('time_limit_seconds', 30),
        )

        return Response(
            {'id': competition_question.id, 'question': QuestionSerializer(question).data},
            status=status.HTTP_201_CREATED,
        )


class JoinCompetitionAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = str(request.data.get('code', '')).strip().upper()
        team_name = str(request.data.get('team_name', '')).strip()
        if not code or not team_name:
            return Response({'detail': 'code and team_name are required'}, status=400)

        competition = get_object_or_404(Competition, code=code)
        team, _ = Team.objects.get_or_create(competition=competition, name=team_name)
        TeamScore.objects.get_or_create(team=team, competition=competition)

        broadcast_event(
            competition.code,
            'team_joined',
            {'team_name': team.name, 'competition_code': competition.code},
        )

        return Response({
            'competition': CompetitionSerializer(competition).data,
            'team': TeamSerializer(team).data,
        }, status=201)


class CurrentQuestionAPIView(APIView):
    """Team-facing snapshot of the live competition state.

    Returns the active question (without revealing which option is
    correct) plus enough timing info for clients to resync a countdown
    after a page refresh or reconnect.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, competition_id):
        competition = get_object_or_404(Competition, id=competition_id)
        cq = competition.current_question

        payload = {
            'competition_code': competition.code,
            'status': competition.status,
            'server_time': timezone.now(),
            'current_question_started_at': competition.current_question_started_at,
            'current_question': None,
        }

        if cq:
            payload['current_question'] = {
                'id': cq.id,
                'order': cq.order,
                'points': cq.points,
                'time_limit_seconds': cq.time_limit_seconds,
                'question': {
                    'id': cq.question.id,
                    'text': cq.question.text,
                    'question_type': cq.question.question_type,
                    'image_url': cq.question.image_url,
                    'options': [
                        {'id': o.id, 'text': o.text, 'order': o.order}
                        for o in cq.question.options.all().order_by('order', 'id')
                    ],
                },
            }

        return Response(payload)


class CompetitionControlAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, competition_id, action):
        competition = get_object_or_404(Competition, id=competition_id)

        if action == 'start':
            if competition.status == 'finished':
                return Response({'detail': 'Competition already finished'}, status=400)
            if competition.current_question is None:
                first_question = competition.competition_questions.order_by('order').first()
                if first_question is None:
                    return Response({'detail': 'No questions attached to this competition'}, status=400)
                competition.current_question = first_question
            competition.status = 'running'
            competition.current_question_started_at = timezone.now()
            competition.save(update_fields=['status', 'current_question', 'current_question_started_at'])
            broadcast_event(
                competition.code,
                'question_started',
                {'competition_code': competition.code, 'question_id': competition.current_question_id, 'time_limit_seconds': competition.current_question.time_limit_seconds},
            )
            return Response({'status': competition.status, 'current_question_id': competition.current_question_id})

        if action == 'pause':
            competition.status = 'paused'
            competition.save(update_fields=['status'])
            broadcast_event(competition.code, 'competition_paused', {'competition_code': competition.code})
            return Response({'status': competition.status})

        if action == 'resume':
            competition.status = 'running'
            if competition.current_question_started_at is None:
                competition.current_question_started_at = timezone.now()
            competition.save(update_fields=['status', 'current_question_started_at'])
            broadcast_event(competition.code, 'competition_resumed', {'competition_code': competition.code})
            return Response({'status': competition.status})

        if action == 'next_question':
            current_question = competition.current_question
            next_question = (
                competition.competition_questions.filter(order__gt=current_question.order).order_by('order').first()
                if current_question else competition.competition_questions.order_by('order').first()
            )
            if next_question is None:
                return Response({'detail': 'No next question available'}, status=400)
            competition.current_question = next_question
            competition.current_question_started_at = timezone.now()
            competition.status = 'running'
            competition.save(update_fields=['status', 'current_question', 'current_question_started_at'])
            broadcast_event(
                competition.code,
                'question_started',
                {'competition_code': competition.code, 'question_id': next_question.id, 'time_limit_seconds': next_question.time_limit_seconds},
            )
            return Response({'status': competition.status, 'current_question_id': next_question.id})

        if action == 'finish':
            competition.status = 'finished'
            competition.current_question = None
            competition.current_question_started_at = None
            competition.save(update_fields=['status', 'current_question', 'current_question_started_at'])
            broadcast_event(competition.code, 'competition_finished', {'competition_code': competition.code})
            return Response({'status': competition.status})

        return Response({'detail': 'Unknown action'}, status=400)


class CompetitionLeaderboardAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, competition_id):
        competition = get_object_or_404(Competition, id=competition_id)
        scores = TeamScore.objects.filter(competition=competition).select_related('team').order_by('-total_points', '-correct_count', 'team__name')
        payload = []
        for rank, score in enumerate(scores, start=1):
            payload.append({
                'rank': rank,
                'team_id': score.team_id,
                'team_name': score.team.name,
                'total_points': score.total_points,
                'correct_count': score.correct_count,
                'average_response_ms': score.average_response_ms,
            })
        broadcast_event(competition.code, 'leaderboard_updated', {'leaderboard': payload})
        return Response(payload)


class CompetitionResultsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, competition_id):
        competition = get_object_or_404(Competition, id=competition_id)
        leaderboard = CompetitionLeaderboardAPIView().get(request, competition_id).data
        return Response({'competition': CompetitionSerializer(competition).data, 'leaderboard': leaderboard})


class SubmitAnswerAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, competition_id):
        competition = get_object_or_404(Competition, id=competition_id)
        team_id = request.data.get('team_id')
        option_id = request.data.get('selected_option_id')

        if not team_id or not option_id:
            return Response({'detail': 'team_id and selected_option_id are required'}, status=400)

        team = get_object_or_404(Team, id=team_id, competition=competition)
        current_question = competition.current_question
        if not current_question:
            return Response({'detail': 'No active question'}, status=400)
        if competition.status != 'running':
            return Response({'detail': 'Competition is not running'}, status=400)

        option = get_object_or_404(QuestionOption, id=option_id, question=current_question.question)

        if competition.current_question_started_at:
            elapsed_ms = int((timezone.now() - competition.current_question_started_at).total_seconds() * 1000)
            if elapsed_ms > current_question.time_limit_seconds * 1000:
                return Response({'detail': 'Time has expired'}, status=400)
        else:
            elapsed_ms = 0

        with transaction.atomic():
            if AnswerSubmission.objects.filter(competition_question=current_question, team=team).exists():
                return Response({'detail': 'Duplicate answer rejected'}, status=409)

            is_correct = bool(option.is_correct)
            submission = AnswerSubmission.objects.create(
                competition=competition,
                competition_question=current_question,
                team=team,
                selected_option=option,
                is_correct=is_correct,
                response_time_ms=elapsed_ms,
                session_id=str(request.session.session_key or ''),
                ip_address=request.META.get('REMOTE_ADDR'),
            )

            score, _ = TeamScore.objects.select_for_update().get(team=team, competition=competition)
            points = compute_points(
                correct=is_correct,
                response_time_seconds=elapsed_ms / 1000.0,
                time_limit_seconds=current_question.time_limit_seconds,
                difficulty=current_question.question.difficulty,
                base_points=current_question.points,
            )

            score.total_points += points
            score.answered_count += 1
            if is_correct:
                score.correct_count += 1
            else:
                score.incorrect_count += 1
            score.response_time_total_ms += elapsed_ms
            score.average_response_ms = score.response_time_total_ms / score.answered_count if score.answered_count else 0
            score.save(update_fields=[
                'total_points',
                'correct_count',
                'incorrect_count',
                'answered_count',
                'response_time_total_ms',
                'average_response_ms',
                'updated_at',
            ])

        leaderboard = CompetitionLeaderboardAPIView().get(request, competition_id).data
        broadcast_event(competition.code, 'score_updated', {'team_name': team.name, 'points': points, 'leaderboard': leaderboard})

        return Response({
            'accepted': True,
            'is_correct': is_correct,
            'points': points,
            'total_points': TeamScore.objects.get(team=team, competition=competition).total_points,
            'response_time_ms': elapsed_ms,
        })
