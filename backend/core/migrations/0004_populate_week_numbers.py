"""
Data migration to populate week_number and week_year fields for existing records.
"""
from django.db import migrations


def populate_week_numbers(apps, schema_editor):
    """
    Populate week_number and week_year for all existing TimeEntry records.

    Uses ISO week numbers which ensures Martinsburg (Saturday week endings)
    and other offices (Sunday week endings) align to the same week.
    """
    TimeEntry = apps.get_model('core', 'TimeEntry')

    # Count records that need updating
    null_count = TimeEntry.objects.filter(week_number__isnull=True).count()
    print(f"\nUpdating {null_count} records with ISO week numbers...")

    # Update in batches for memory efficiency
    batch_size = 5000
    updated = 0

    while True:
        # Get a batch of records without week numbers
        entries = list(
            TimeEntry.objects
            .filter(week_number__isnull=True)
            .only('id', 'dt_end_cli_work_week')[:batch_size]
        )

        if not entries:
            break

        for entry in entries:
            if entry.dt_end_cli_work_week:
                iso_cal = entry.dt_end_cli_work_week.isocalendar()
                entry.week_number = iso_cal[1]
                entry.week_year = iso_cal[0]

        # Bulk update
        TimeEntry.objects.bulk_update(entries, ['week_number', 'week_year'])
        updated += len(entries)
        print(f"  Updated {updated} records...")

    print(f"Completed: Updated {updated} records with ISO week numbers")


def reverse_populate(apps, schema_editor):
    """
    Reverse migration: clear week_number and week_year fields.
    """
    TimeEntry = apps.get_model('core', 'TimeEntry')
    TimeEntry.objects.all().update(week_number=None, week_year=None)
    print("Cleared all week_number and week_year values")


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_add_week_number_fields'),
    ]

    operations = [
        migrations.RunPython(populate_week_numbers, reverse_populate),
    ]
