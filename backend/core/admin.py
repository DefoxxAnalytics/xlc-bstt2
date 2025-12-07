from django.contrib import admin, messages
from django.utils.html import format_html
from .models import TimeEntry, ETLHistory, DataUpload
from .services import process_uploaded_file


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'xlc_operation', 'entry_type', 'dt_end_cli_work_week', 'total_hours']
    list_filter = ['year', 'xlc_operation', 'entry_type', 'dt_end_cli_work_week']
    search_fields = ['full_name', 'last_name', 'first_name', 'applicant_id']
    date_hierarchy = 'dt_end_cli_work_week'
    readonly_fields = ['full_name']

    fieldsets = (
        ('Employee', {
            'fields': ('applicant_id', 'full_name', 'first_name', 'last_name', 'employee_type_id')
        }),
        ('Location', {
            'fields': ('xlc_operation', 'ofc_name', 'bu_dept_name', 'shift_number')
        }),
        ('Time Period', {
            'fields': ('year', 'dt_end_cli_work_week', 'work_date', 'date_range')
        }),
        ('Hours', {
            'fields': ('reg_hours', 'ot_hours', 'dt_hours', 'hol_wrk_hours', 'total_hours')
        }),
        ('Clock Details', {
            'fields': ('dt_time_start', 'dt_time_end', 'clock_in_method', 'clock_out_method',
                      'clock_in_tries', 'clock_out_tries'),
            'classes': ('collapse',)
        }),
        ('Classification', {
            'fields': ('entry_type', 'allocation_method')
        }),
    )


@admin.register(ETLHistory)
class ETLHistoryAdmin(admin.ModelAdmin):
    list_display = ['year', 'run_date', 'status', 'records_processed', 'duration_seconds']
    list_filter = ['year', 'status']
    readonly_fields = ['run_date', 'records_processed', 'status', 'message', 'duration_seconds']


@admin.register(DataUpload)
class DataUploadAdmin(admin.ModelAdmin):
    list_display = ['id', 'filename_display', 'year', 'file_type', 'status_display',
                   'records_processed', 'uploaded_at', 'uploaded_by']
    list_filter = ['year', 'status', 'file_type', 'uploaded_at']
    readonly_fields = ['status', 'records_processed', 'error_message', 'processing_time',
                      'uploaded_at', 'uploaded_by']
    actions = ['process_uploads']

    fieldsets = (
        ('Upload File', {
            'fields': ('file', 'file_type', 'year', 'replace_existing'),
            'description': 'Upload a CSV or Excel file with time entry data. '
                          'The file should have columns matching the expected format '
                          '(e.g., FullName, XLC Operation, EntryType, dtEndCliWorkWeek, etc.)'
        }),
        ('Processing Status', {
            'fields': ('status', 'records_processed', 'processing_time', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('uploaded_at', 'uploaded_by'),
            'classes': ('collapse',)
        }),
    )

    def filename_display(self, obj):
        return obj.filename
    filename_display.short_description = 'File'

    def status_display(self, obj):
        colors = {
            'pending': '#f0ad4e',
            'processing': '#5bc0de',
            'success': '#5cb85c',
            'failed': '#d9534f',
        }
        color = colors.get(obj.status, '#777')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'

    def save_model(self, request, obj, form, change):
        if not change:  # New upload
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)

        # Auto-process if this is a new upload
        if not change and obj.status == 'pending':
            self._process_single_upload(request, obj)

    def _process_single_upload(self, request, upload):
        """Process a single upload and show result message."""
        upload.status = 'processing'
        upload.save()

        success, message, records = process_uploaded_file(upload)

        upload.records_processed = records
        if success:
            upload.status = 'success'
            upload.error_message = ''
            messages.success(request, f'Successfully processed: {message}')
        else:
            upload.status = 'failed'
            upload.error_message = message
            messages.error(request, f'Processing failed: {message}')

        upload.save()

    @admin.action(description='Process selected uploads')
    def process_uploads(self, request, queryset):
        """Admin action to process selected uploads."""
        processed = 0
        failed = 0

        for upload in queryset.filter(status__in=['pending', 'failed']):
            upload.status = 'processing'
            upload.save()

            success, message, records = process_uploaded_file(upload)

            upload.records_processed = records
            if success:
                upload.status = 'success'
                upload.error_message = ''
                processed += 1
            else:
                upload.status = 'failed'
                upload.error_message = message
                failed += 1

            upload.save()

        if processed:
            messages.success(request, f'Successfully processed {processed} upload(s)')
        if failed:
            messages.error(request, f'Failed to process {failed} upload(s)')
