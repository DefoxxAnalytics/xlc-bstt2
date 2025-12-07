"""
Django-filter classes for BSTT Compliance Dashboard.
"""
import django_filters
from .models import TimeEntry


class TimeEntryFilter(django_filters.FilterSet):
    """Filter for TimeEntry queries."""
    year = django_filters.NumberFilter()
    year__gte = django_filters.NumberFilter(field_name='year', lookup_expr='gte')
    year__lte = django_filters.NumberFilter(field_name='year', lookup_expr='lte')

    xlc_operation = django_filters.CharFilter(lookup_expr='iexact')
    xlc_operation__in = django_filters.BaseInFilter(field_name='xlc_operation')

    entry_type = django_filters.CharFilter(lookup_expr='iexact')
    entry_type__in = django_filters.BaseInFilter(field_name='entry_type')

    dt_end_cli_work_week = django_filters.DateFilter()
    dt_end_cli_work_week__gte = django_filters.DateFilter(field_name='dt_end_cli_work_week', lookup_expr='gte')
    dt_end_cli_work_week__lte = django_filters.DateFilter(field_name='dt_end_cli_work_week', lookup_expr='lte')

    # ISO week number filters (for cross-office alignment)
    week_number = django_filters.NumberFilter()
    week_number__gte = django_filters.NumberFilter(field_name='week_number', lookup_expr='gte')
    week_number__lte = django_filters.NumberFilter(field_name='week_number', lookup_expr='lte')
    week_year = django_filters.NumberFilter()
    week_year__gte = django_filters.NumberFilter(field_name='week_year', lookup_expr='gte')
    week_year__lte = django_filters.NumberFilter(field_name='week_year', lookup_expr='lte')

    bu_dept_name = django_filters.CharFilter(lookup_expr='icontains')
    bu_dept_name__in = django_filters.BaseInFilter(field_name='bu_dept_name')

    applicant_id = django_filters.CharFilter()
    full_name = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = TimeEntry
        fields = [
            'year', 'xlc_operation', 'entry_type', 'dt_end_cli_work_week',
            'week_number', 'week_year', 'bu_dept_name', 'applicant_id', 'full_name'
        ]
