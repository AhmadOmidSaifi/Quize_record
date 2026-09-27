from rest_framework import serializers

from .models import (
    AnswerSubmission,
    Competition,
    CompetitionQuestion,
    Question,
    QuestionOption,
    Team,
    TeamScore,
)


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'text', 'is_correct', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            'id',
            'text',
            'question_type',
            'difficulty',
            'explanation',
            'image_url',
            'options',
            'created_by',
            'created_at',
        ]
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        options_data = self.context['request'].data.get('options', [])
        question = Question.objects.create(**validated_data)
        for index, option in enumerate(options_data):
            QuestionOption.objects.create(
                question=question,
                text=str(option.get('text', '')).strip(),
                is_correct=bool(option.get('is_correct', False)),
                order=index,
            )
        return question


class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = ['id', 'code', 'title', 'description', 'status', 'settings', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['code', 'created_by', 'created_at', 'updated_at']


class CompetitionQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = CompetitionQuestion
        fields = ['id', 'competition', 'question', 'order', 'points', 'time_limit_seconds']


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'competition', 'name', 'created_at']
        read_only_fields = ['created_at']


class TeamScoreSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = TeamScore
        fields = [
            'team',
            'team_name',
            'total_points',
            'correct_count',
            'incorrect_count',
            'answered_count',
            'average_response_ms',
            'updated_at',
        ]


class AnswerSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerSubmission
        fields = [
            'id',
            'competition',
            'competition_question',
            'team',
            'selected_option',
            'is_correct',
            'response_time_ms',
            'submitted_at',
        ]
