"""
URL configuration for core app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimeEntryViewSet, ETLHistoryViewSet, FilterOptionsView, DataQualityView

router = DefaultRouter()
router.register(r'time-entries', TimeEntryViewSet)
router.register(r'etl-history', ETLHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('filters/options/', FilterOptionsView.as_view(), name='filter-options'),
    path('data-quality/', DataQualityView.as_view(), name='data-quality'),
]
