"""
URL configuration for reports app.
"""
from django.urls import path
from .views import FullReportView, WeeklySummaryView

urlpatterns = [
    path('full/', FullReportView.as_view(), name='report-full'),
    path('weekly-summary/', WeeklySummaryView.as_view(), name='report-weekly-summary'),
]
