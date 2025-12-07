"""
Report download views for BSTT Compliance Dashboard.
"""
from datetime import datetime
from django.http import HttpResponse
from rest_framework.views import APIView
from core.models import TimeEntry
from core.filters import TimeEntryFilter
from .generators import BSTTReportGenerator


class ReportBaseView(APIView):
    """Base view for report endpoints with filtering support."""

    def get_filtered_queryset(self, request):
        """Apply filters from query params."""
        queryset = TimeEntry.objects.all()
        filterset = TimeEntryFilter(request.query_params, queryset=queryset)
        if filterset.is_valid():
            return filterset.qs
        return queryset


class FullReportView(ReportBaseView):
    """Download full BSTT Excel report."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        year = request.query_params.get('year', datetime.now().year)

        # Capture filters for metadata sheet
        filters = {
            'year': request.query_params.get('year'),
            'xlc_operation': request.query_params.get('xlc_operation'),
            'entry_type': request.query_params.get('entry_type'),
            'dt_end_cli_work_week__gte': request.query_params.get('dt_end_cli_work_week__gte'),
            'dt_end_cli_work_week__lte': request.query_params.get('dt_end_cli_work_week__lte'),
        }

        generator = BSTTReportGenerator(queryset, year=int(year), filters=filters)
        output = generator.generate_full_report()

        filename = f"BSTT_Report_{year}_{datetime.now().strftime('%Y%m%d')}.xlsx"

        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class WeeklySummaryView(ReportBaseView):
    """Download weekly summary report."""

    def get(self, request):
        queryset = self.get_filtered_queryset(request)
        year = request.query_params.get('year', datetime.now().year)

        generator = BSTTReportGenerator(queryset, year=int(year))
        output = generator.generate_weekly_summary()

        filename = f"BSTT_Weekly_Summary_{datetime.now().strftime('%Y%m%d')}.xlsx"

        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
