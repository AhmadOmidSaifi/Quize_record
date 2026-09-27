from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import RegisterSerializer

User = get_user_model()


class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class LoginAPIView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class RefreshAPIView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
