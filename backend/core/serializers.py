"""
Serializers for BSTT Compliance Dashboard.
"""
from rest_framework import serializers
from .models import TimeEntry, ETLHistory


class TimeEntrySerializer(serializers.ModelSerializer):
    """Serializer for TimeEntry model."""
    class Meta:
        model = TimeEntry
        fields = '__all__'


class TimeEntryListSerializer(serializers.ModelSerializer):
    """Serializer for list views with essential Data Explorer fields."""
    class Meta:
        model = TimeEntry
        fields = [
            'id', 'year', 'xlc_operation', 'full_name', 'applicant_id',
            'entry_type', 'dt_end_cli_work_week', 'bu_dept_name', 'shift_number',
            'total_hours', 'reg_hours', 'ot_hours', 'dt_hours', 'hol_wrk_hours',
            'clock_in_method', 'clock_in_tries', 'clock_out_method', 'clock_out_tries'
        ]


class TimeEntrySummarySerializer(serializers.Serializer):
    """Serializer for aggregated summary data."""
    total_entries = serializers.IntegerField()
    total_hours = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_reg_hours = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_ot_hours = serializers.DecimalField(max_digits=12, decimal_places=2)
    unique_employees = serializers.IntegerField()
    unique_offices = serializers.IntegerField()
    date_range = serializers.CharField()
    entry_type_breakdown = serializers.DictField()


class ETLHistorySerializer(serializers.ModelSerializer):
    """Serializer for ETL history."""
    class Meta:
        model = ETLHistory
        fields = '__all__'


class FilterOptionsSerializer(serializers.Serializer):
    """Serializer for filter dropdown options."""
    years = serializers.ListField(child=serializers.IntegerField())
    offices = serializers.ListField(child=serializers.CharField())
    departments = serializers.ListField(child=serializers.CharField())
    entry_types = serializers.ListField(child=serializers.CharField())
    weeks = serializers.ListField(child=serializers.DateField())
