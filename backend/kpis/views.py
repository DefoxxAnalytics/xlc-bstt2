"""
KPI API Views for BSTT Compliance Dashboard.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import TimeEntry
from core.filters import TimeEntryFilter
from .calculator import KPICalculator


class KPIBaseView(APIView):
    """Base view for KPI endpoints with filtering support."""

    def get_filtered_queryset(self, request):
        """Apply filters from query params."""
        queryset = TimeEntry.objects.all()
        filterset = TimeEntryFilter(request.query_params, queryset=queryset)
        if filterset.is_valid():
            return filterset.qs
        return queryset


class KPIView(KPIBaseView):
    """All KPIs endpoint."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.calculate_all())


class ComplianceKPIView(KPIBaseView):
    """Compliance KPIs only."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.compliance_kpis())


class VolumeKPIView(KPIBaseView):
    """Volume KPIs only."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.volume_kpis())


class EfficiencyKPIView(KPIBaseView):
    """Efficiency KPIs only."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.efficiency_kpis())


class KPIByOfficeView(KPIBaseView):
    """KPIs grouped by office."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.by_office())


class KPIByWeekView(KPIBaseView):
    """KPIs grouped by week."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.by_week())


class KPITrendsView(KPIBaseView):
    """Week-over-week trends."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.trends())


class KPIByEmployeeView(KPIBaseView):
    """KPIs grouped by employee."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.by_employee())


class ClockBehaviorView(KPIBaseView):
    """Clock behavior analytics."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.clock_behavior())


class KPIByDepartmentView(KPIBaseView):
    """KPIs grouped by department."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.by_department())


class KPIByShiftView(KPIBaseView):
    """KPIs grouped by shift."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        calculator = KPICalculator(queryset)
        return Response(calculator.by_shift())
