"""
API Views for BSTT Compliance Dashboard.
"""
from django.db.models import Sum, Count, Min, Max
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TimeEntry, ETLHistory
from .serializers import (
    TimeEntrySerializer, TimeEntryListSerializer,
    TimeEntrySummarySerializer, ETLHistorySerializer,
    FilterOptionsSerializer
)
from .filters import TimeEntryFilter


class TimeEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for time entries."""
    queryset = TimeEntry.objects.all()
    filterset_class = TimeEntryFilter
    search_fields = ['full_name', 'last_name', 'first_name', 'applicant_id']
    ordering_fields = ['dt_end_cli_work_week', 'xlc_operation', 'full_name', 'total_hours']

    def get_serializer_class(self):
        if self.action == 'list':
            return TimeEntryListSerializer
        return TimeEntrySerializer

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get aggregated summary of filtered time entries."""
        queryset = self.filter_queryset(self.get_queryset())

        # Calculate aggregates
        agg = queryset.aggregate(
            total_entries=Count('id'),
            total_hours=Sum('total_hours'),
            total_reg_hours=Sum('reg_hours'),
            total_ot_hours=Sum('ot_hours'),
            unique_employees=Count('applicant_id', distinct=True),
            unique_offices=Count('xlc_operation', distinct=True),
            min_date=Min('dt_end_cli_work_week'),
            max_date=Max('dt_end_cli_work_week'),
        )

        # Entry type breakdown
        entry_types = queryset.values('entry_type').annotate(
            count=Count('id')
        ).order_by('-count')

        entry_type_breakdown = {
            item['entry_type']: item['count']
            for item in entry_types
        }

        # Build date range string
        date_range = ""
        if agg['min_date'] and agg['max_date']:
            date_range = f"{agg['min_date']} to {agg['max_date']}"

        data = {
            'total_entries': agg['total_entries'] or 0,
            'total_hours': agg['total_hours'] or 0,
            'total_reg_hours': agg['total_reg_hours'] or 0,
            'total_ot_hours': agg['total_ot_hours'] or 0,
            'unique_employees': agg['unique_employees'] or 0,
            'unique_offices': agg['unique_offices'] or 0,
            'date_range': date_range,
            'entry_type_breakdown': entry_type_breakdown,
        }

        serializer = TimeEntrySummarySerializer(data)
        return Response(serializer.data)


class ETLHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for ETL history."""
    queryset = ETLHistory.objects.all()
    serializer_class = ETLHistorySerializer


class FilterOptionsView(APIView):
    """API endpoint to get available filter options."""

    def get(self, request):
        # Get unique values for each filter field
        years = list(
            TimeEntry.objects.values_list('year', flat=True)
            .distinct().order_by('-year')
        )
        offices = list(
            TimeEntry.objects.values_list('xlc_operation', flat=True)
            .distinct().order_by('xlc_operation')
        )
        departments = list(
            TimeEntry.objects.exclude(bu_dept_name='')
            .values_list('bu_dept_name', flat=True)
            .distinct().order_by('bu_dept_name')
        )
        entry_types = list(
            TimeEntry.objects.values_list('entry_type', flat=True)
            .distinct().order_by('entry_type')
        )
        weeks = list(
            TimeEntry.objects.values_list('dt_end_cli_work_week', flat=True)
            .distinct().order_by('-dt_end_cli_work_week')
        )

        data = {
            'years': years,
            'offices': offices,
            'departments': departments,
            'entry_types': entry_types,
            'weeks': weeks,
        }

        serializer = FilterOptionsSerializer(data)
        return Response(serializer.data)


class DataQualityView(APIView):
    """API endpoint for data quality indicators."""

    def get(self, request):
        from django.utils import timezone

        # Get overall data stats
        total_records = TimeEntry.objects.count()

        # Get date range of data
        date_stats = TimeEntry.objects.aggregate(
            min_date=Min('dt_end_cli_work_week'),
            max_date=Max('dt_end_cli_work_week'),
        )

        # Get latest ETL run info
        latest_etl = ETLHistory.objects.filter(status='success').first()

        # Get data by year
        years_data = list(
            TimeEntry.objects.values('year')
            .annotate(count=Count('id'))
            .order_by('-year')
        )

        # Calculate data freshness
        data_freshness = 'unknown'
        last_data_date = None
        if date_stats['max_date']:
            last_data_date = date_stats['max_date']
            days_old = (timezone.now().date() - last_data_date).days
            if days_old <= 7:
                data_freshness = 'current'
            elif days_old <= 14:
                data_freshness = 'recent'
            elif days_old <= 30:
                data_freshness = 'stale'
            else:
                data_freshness = 'outdated'

        data = {
            'total_records': total_records,
            'min_date': date_stats['min_date'].isoformat() if date_stats['min_date'] else None,
            'max_date': date_stats['max_date'].isoformat() if date_stats['max_date'] else None,
            'data_freshness': data_freshness,
            'last_etl_run': latest_etl.run_date.isoformat() if latest_etl else None,
            'last_etl_status': latest_etl.status if latest_etl else None,
            'last_etl_records': latest_etl.records_processed if latest_etl else 0,
            'years_data': years_data,
        }

        return Response(data)
