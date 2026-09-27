from django.contrib import admin
from .models import Competition, Question, Team, TeamScore, CompetitionQuestion, AnswerSubmission

admin.site.register(Competition)
admin.site.register(Question)
admin.site.register(Team)
admin.site.register(TeamScore)
admin.site.register(CompetitionQuestion)
admin.site.register(AnswerSubmission)
