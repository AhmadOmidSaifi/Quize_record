from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_event(competition_code: str, event_type: str, payload: dict):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        f'competition_{competition_code}',
        {'type': event_type, **payload},
    )
