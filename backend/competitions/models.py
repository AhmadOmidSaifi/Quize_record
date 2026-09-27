from django.conf import settings
from django.db import models
from django.utils.crypto import get_random_string


class Competition(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('waiting', 'Waiting Room'),
        ('running', 'Running'),
        ('paused', 'Paused'),
        ('finished', 'Finished'),
    )

    code = models.CharField(max_length=12, unique=True, db_index=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    current_question = models.ForeignKey(
        'CompetitionQuestion',
        null=True,
        blank=True,
        related_name='active_competitions',
        on_delete=models.SET_NULL,
    )
    current_question_started_at = models.DateTimeField(null=True, blank=True)
    settings = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='competitions',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = get_random_string(length=8).upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.title} ({self.code})'


class Question(models.Model):
    QUESTION_TYPES = (
        ('mcq', 'Multiple Choice'),
        ('true_false', 'True / False'),
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='questions',
    )
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='mcq')
    difficulty = models.PositiveSmallIntegerField(default=2)
    explanation = models.TextField(blank=True)
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.text[:80]


class QuestionOption(models.Model):
    question = models.ForeignKey(Question, related_name='options', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.question_id}: {self.text[:40]}'


class CompetitionQuestion(models.Model):
    competition = models.ForeignKey(Competition, related_name='competition_questions', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    points = models.IntegerField(default=100)
    time_limit_seconds = models.IntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']
        unique_together = ('competition', 'order')

    def __str__(self):
        return f'{self.competition.title} - Q{self.order}'


class Team(models.Model):
    competition = models.ForeignKey(Competition, related_name='teams', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('competition', 'name')
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.competition.code})'


class TeamMember(models.Model):
    team = models.ForeignKey(Team, related_name='members', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} @ {self.team.name}'


class AnswerSubmission(models.Model):
    competition = models.ForeignKey(Competition, related_name='submissions', on_delete=models.CASCADE)
    competition_question = models.ForeignKey(CompetitionQuestion, related_name='submissions', on_delete=models.CASCADE)
    team = models.ForeignKey(Team, related_name='submissions', on_delete=models.CASCADE)
    selected_option = models.ForeignKey(QuestionOption, null=True, blank=True, on_delete=models.SET_NULL)
    is_correct = models.BooleanField(default=False)
    response_time_ms = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=128, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        unique_together = ('competition_question', 'team')
        ordering = ['submitted_at']

    def __str__(self):
        return f'{self.team.name} -> {self.competition_question_id}'


class TeamScore(models.Model):
    competition = models.ForeignKey(Competition, related_name='team_scores', on_delete=models.CASCADE)
    team = models.ForeignKey(Team, related_name='scores', on_delete=models.CASCADE)
    total_points = models.IntegerField(default=0)
    correct_count = models.IntegerField(default=0)
    incorrect_count = models.IntegerField(default=0)
    answered_count = models.IntegerField(default=0)
    average_response_ms = models.FloatField(default=0)
    response_time_total_ms = models.BigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('competition', 'team')

    def __str__(self):
        return f'{self.team.name}: {self.total_points} pts'


class CompetitionResult(models.Model):
    competition = models.OneToOneField(Competition, related_name='result', on_delete=models.CASCADE)
    winner_team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.SET_NULL)
    leaderboard_json = models.JSONField(default=list, blank=True)
    total_teams = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.competition.title} result'
