from django.urls import path
from .views import RegisterAPIView, LoginAPIView, RefreshAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('refresh/', RefreshAPIView.as_view(), name='refresh'),
]
