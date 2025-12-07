"""
Django management command to sync data from BSTT CSV files.
"""
import time
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import pandas as pd
from core.models import TimeEntry, ETLHistory


class Command(BaseCommand):
    help = 'Sync time entries from BSTT CSV files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=int,
            help='Specific year to sync (e.g., 2025)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before import'
        )

    def handle(self, *args, **options):
        start_time = time.time()
        data_dir = settings.BSTT_PROJECT_DIR / 'output'

        if not data_dir.exists():
            raise CommandError(f"Data directory not found: {data_dir}")

        year = options.get('year')
        clear = options.get('clear', False)

        # Find CSV files - check both patterns
        if year:
            # Try year subfolder first (e.g., output/2025/YTD_Data_Weekly.csv)
            csv_files = list(data_dir.glob(f"{year}/YTD_Data_Weekly.csv"))
            if not csv_files:
                # Try old pattern (e.g., output/bstt_data_2025.csv)
                csv_files = list(data_dir.glob(f"bstt_data_{year}.csv"))
            if not csv_files:
                raise CommandError(f"No CSV file found for year {year}")
        else:
            # Get all years from subfolders
            csv_files = sorted(data_dir.glob("*/YTD_Data_Weekly.csv"))
            if not csv_files:
                csv_files = sorted(data_dir.glob("bstt_data_*.csv"))
            if not csv_files:
                raise CommandError(f"No CSV files found in {data_dir}")

        self.stdout.write(f"Found {len(csv_files)} CSV file(s)")

        for csv_file in csv_files:
            self._sync_file(csv_file, clear)

        elapsed = time.time() - start_time
        self.stdout.write(
            self.style.SUCCESS(f"Sync completed in {elapsed:.1f} seconds")
        )

    def _sync_file(self, csv_path: Path, clear: bool):
        """Sync a single CSV file."""
        self.stdout.write(f"Processing {csv_path.name}...")

        # Read CSV
        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error reading {csv_path}: {e}"))
            return

        if df.empty:
            self.stdout.write(self.style.WARNING(f"Empty file: {csv_path}"))
            return

        # Detect year from data, path, or filename
        if 'year' in df.columns:
            year = int(df['year'].iloc[0])
        else:
            import re
            # Try to extract from parent directory name (e.g., output/2025/file.csv)
            parent_name = csv_path.parent.name
            if re.match(r'^\d{4}$', parent_name):
                year = int(parent_name)
            else:
                # Try to extract from filename
                match = re.search(r'(\d{4})', csv_path.stem)
                if match:
                    year = int(match.group(1))
                else:
                    year = 2025  # Default

        # Create ETL history record
        etl = ETLHistory.objects.create(
            year=year,
            status='running',
            message=f"Processing {csv_path.name}"
        )

        try:
            # Clear existing data if requested
            if clear:
                deleted, _ = TimeEntry.objects.filter(year=year).delete()
                self.stdout.write(f"Cleared {deleted} existing records for year {year}")
            else:
                # Always clear for the year being imported to avoid duplicates
                TimeEntry.objects.filter(year=year).delete()

            # Map CSV columns to model fields (handle multiple naming conventions)
            column_mapping = {
                # Year
                'year': 'year',
                # Office/Location
                'OfcName': 'ofc_name',
                'Ofc_Name': 'ofc_name',
                'XLC Operation': 'xlc_operation',
                'XLC_Operation': 'xlc_operation',
                # Time Period
                'dtEndCliWorkWeek': 'dt_end_cli_work_week',
                'Dt_End_CLI_Work_Week': 'dt_end_cli_work_week',
                'WorkDate': 'work_date',
                'Work_Date': 'work_date',
                'Date Range': 'date_range',
                'Date_Range': 'date_range',
                # Employee Info
                'ApplicantID': 'applicant_id',
                'Applicant_ID': 'applicant_id',
                'LastName': 'last_name',
                'Last_Name': 'last_name',
                'FirstName': 'first_name',
                'First_Name': 'first_name',
                'FullName': 'full_name',
                'Full_Name': 'full_name',
                'EmployeeTypeID': 'employee_type_id',
                'Employee_Type_ID': 'employee_type_id',
                # Shift/Department
                'ShiftNumber': 'shift_number',
                'Shift_Number': 'shift_number',
                'BUDeptName': 'bu_dept_name',
                'BU_Dept_Name': 'bu_dept_name',
                'Allocation_Method': 'allocation_method',
                # Clock Times
                'dtTimeStart': 'dt_time_start',
                'Dt_Time_Start': 'dt_time_start',
                'dtTimeEnd': 'dt_time_end',
                'Dt_Time_End': 'dt_time_end',
                # Hours
                'RegHours': 'reg_hours',
                'Reg_Hours': 'reg_hours',
                'OTHours': 'ot_hours',
                'OT_Hours': 'ot_hours',
                'DTHours': 'dt_hours',
                'DT_Hours': 'dt_hours',
                'HolWrkHours': 'hol_wrk_hours',
                'Hol_Wrk_Hours': 'hol_wrk_hours',
                'Total Hours': 'total_hours',
                'Total_Hours': 'total_hours',
                # Clock Behavior
                'ClockIn_LOcal': 'clock_in_local',
                'Clock_In_Local': 'clock_in_local',
                'ClockIn_Tries': 'clock_in_tries',
                'Clock_In_Tries': 'clock_in_tries',
                'ClockIn_Method': 'clock_in_method',
                'Clock_In_Method': 'clock_in_method',
                'ClockOut_Local': 'clock_out_local',
                'Clock_Out_Local': 'clock_out_local',
                'ClockOut_Tries': 'clock_out_tries',
                'Clock_Out_Tries': 'clock_out_tries',
                'ClockOut_Method': 'clock_out_method',
                'Clock_Out_Method': 'clock_out_method',
                # Entry Classification
                'EntryType': 'entry_type',
                'Entry_Type': 'entry_type',
            }

            # Rename columns
            df_renamed = df.rename(columns=column_mapping)

            # Keep only columns that exist in model
            model_fields = [f.name for f in TimeEntry._meta.get_fields() if hasattr(f, 'column')]
            valid_cols = [c for c in df_renamed.columns if c in model_fields]
            df_clean = df_renamed[valid_cols].copy()

            # Parse dates
            date_cols = ['dt_end_cli_work_week', 'work_date']
            for col in date_cols:
                if col in df_clean.columns:
                    df_clean[col] = pd.to_datetime(df_clean[col], errors='coerce').dt.date

            datetime_cols = ['dt_time_start', 'dt_time_end']
            for col in datetime_cols:
                if col in df_clean.columns:
                    df_clean[col] = pd.to_datetime(df_clean[col], errors='coerce')

            # Handle numeric columns
            numeric_cols = ['reg_hours', 'ot_hours', 'dt_hours', 'hol_wrk_hours', 'total_hours',
                          'clock_in_tries', 'clock_out_tries']
            for col in numeric_cols:
                if col in df_clean.columns:
                    df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').fillna(0)

            # Fill NaN for string columns
            str_cols = ['ofc_name', 'xlc_operation', 'date_range', 'applicant_id',
                       'last_name', 'first_name', 'full_name', 'employee_type_id',
                       'shift_number', 'bu_dept_name', 'allocation_method',
                       'clock_in_local', 'clock_in_method', 'clock_out_local',
                       'clock_out_method', 'entry_type']
            for col in str_cols:
                if col in df_clean.columns:
                    df_clean[col] = df_clean[col].fillna('')

            # Ensure year column exists
            if 'year' not in df_clean.columns:
                df_clean['year'] = year

            # Extract ISO week numbers from dt_end_cli_work_week
            # This aligns Martinsburg (Saturday endings) with other offices (Sunday endings)
            if 'dt_end_cli_work_week' in df_clean.columns:
                df_clean['week_number'] = df_clean['dt_end_cli_work_week'].apply(
                    lambda d: d.isocalendar()[1] if d else None
                )
                df_clean['week_year'] = df_clean['dt_end_cli_work_week'].apply(
                    lambda d: d.isocalendar()[0] if d else None
                )

            # Create TimeEntry objects
            records = df_clean.to_dict('records')
            entries = [TimeEntry(**record) for record in records]

            # Bulk create
            TimeEntry.objects.bulk_create(entries, batch_size=5000)

            elapsed = time.time() - etl.run_date.timestamp()
            etl.status = 'success'
            etl.records_processed = len(entries)
            etl.duration_seconds = elapsed
            etl.message = f"Successfully imported {len(entries)} records"
            etl.save()

            self.stdout.write(
                self.style.SUCCESS(f"Imported {len(entries)} records for year {year}")
            )

        except Exception as e:
            etl.status = 'failed'
            etl.message = str(e)
            etl.save()
            raise CommandError(f"Error importing data: {e}")
