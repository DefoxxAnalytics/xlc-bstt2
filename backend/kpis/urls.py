"""
URL configuration for KPIs app.
"""
from django.urls import path
from .views import (
    KPIView, ComplianceKPIView, VolumeKPIView, EfficiencyKPIView,
    KPIByOfficeView, KPIByWeekView, KPITrendsView, KPIByEmployeeView,
    ClockBehaviorView, KPIByDepartmentView, KPIByShiftView
)

urlpatterns = [
    path('', KPIView.as_view(), name='kpis'),
    path('compliance/', ComplianceKPIView.as_view(), name='kpis-compliance'),
    path('volume/', VolumeKPIView.as_view(), name='kpis-volume'),
    path('efficiency/', EfficiencyKPIView.as_view(), name='kpis-efficiency'),
    path('by-office/', KPIByOfficeView.as_view(), name='kpis-by-office'),
    path('by-week/', KPIByWeekView.as_view(), name='kpis-by-week'),
    path('by-employee/', KPIByEmployeeView.as_view(), name='kpis-by-employee'),
    path('by-department/', KPIByDepartmentView.as_view(), name='kpis-by-department'),
    path('by-shift/', KPIByShiftView.as_view(), name='kpis-by-shift'),
    path('trends/', KPITrendsView.as_view(), name='kpis-trends'),
    path('clock-behavior/', ClockBehaviorView.as_view(), name='kpis-clock-behavior'),
]
