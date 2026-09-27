from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import Competition, Team


class CompetitionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.competition_code = self.scope['url_route']['kwargs']['code']
        await self.accept()
        competition = await database_sync_to_async(self.get_competition)()
        await self.channel_layer.group_add(f'competition_{self.competition_code}', self.channel_name)
        await self.send_json({
            'type': 'competition_connected',
            'competition_code': self.competition_code,
            'status': competition.status if competition else None,
        })

    def get_competition(self):
        return Competition.objects.filter(code=self.competition_code).first()

    async def receive_json(self, content):
        message_type = content.get('type')
        if message_type == 'join_team':
            team_name = (content.get('team_name') or '').strip()
            if not team_name:
                await self.send_json({'type': 'error', 'message': 'team_name is required'})
                return

            competition = await database_sync_to_async(self.get_competition)()
            if not competition:
                await self.send_json({'type': 'error', 'message': 'competition not found'})
                return

            team, _ = await database_sync_to_async(self.ensure_team)(competition, team_name)
            await self.channel_layer.group_send(
                f'competition_{competition.code}',
                {'type': 'team_joined', 'team_name': team.name, 'competition_code': competition.code},
            )
            await self.send_json({'type': 'team_joined', 'team_name': team.name, 'competition_code': competition.code})

    def ensure_team(self, competition, team_name):
        return Team.objects.get_or_create(competition=competition, name=team_name)

    async def team_joined(self, event):
        await self.send_json({
            'type': 'team_joined',
            'team_name': event['team_name'],
            'competition_code': event['competition_code'],
        })

    async def leaderboard_updated(self, event):
        await self.send_json({'type': 'leaderboard_updated', 'leaderboard': event.get('leaderboard', [])})

    async def question_started(self, event):
        await self.send_json({
            'type': 'question_started',
            'question_id': event.get('question_id'),
            'time_limit_seconds': event.get('time_limit_seconds'),
        })

    async def competition_paused(self, event):
        await self.send_json({'type': 'competition_paused', 'competition_code': event.get('competition_code')})

    async def competition_resumed(self, event):
        await self.send_json({'type': 'competition_resumed', 'competition_code': event.get('competition_code')})

    async def competition_finished(self, event):
        await self.send_json({'type': 'competition_finished', 'competition_code': event.get('competition_code')})

    async def score_updated(self, event):
        await self.send_json({
            'type': 'score_updated',
            'team_name': event.get('team_name'),
            'points': event.get('points'),
            'leaderboard': event.get('leaderboard', []),
        })

    async def disconnect(self, code):
        try:
            await self.channel_layer.group_discard(f'competition_{self.competition_code}', self.channel_name)
        except Exception:
            pass
        await super().disconnect(code)
