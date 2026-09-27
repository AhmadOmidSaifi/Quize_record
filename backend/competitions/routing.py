from django.urls import re_path

from .consumers import CompetitionConsumer

websocket_urlpatterns = [
    re_path(r'ws/competitions/(?P<code>[^/]+)/$', CompetitionConsumer.as_asgi()),
]
