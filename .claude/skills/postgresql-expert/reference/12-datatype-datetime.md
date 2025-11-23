# 8.5. Date/Time Types

PostgreSQL supports comprehensive SQL date and time types. The main types include:

## Data Types Overview

| Type | Storage | Description | Range | Resolution |
|------|---------|-------------|-------|-----------|
| `timestamp without time zone` | 8 bytes | Date and time, no timezone | 4713 BC to 294276 AD | 1 microsecond |
| `timestamp with time zone` | 8 bytes | Date and time, with timezone | 4713 BC to 294276 AD | 1 microsecond |
| `date` | 4 bytes | Date only | 4713 BC to 5874897 AD | 1 day |
| `time without time zone` | 8 bytes | Time of day only | 00:00:00 to 24:00:00 | 1 microsecond |
| `time with time zone` | 12 bytes | Time with timezone | 00:00:00+1559 to 24:00:00-1559 | 1 microsecond |
| `interval` | 16 bytes | Time duration | -178000000 to 178000000 years | 1 microsecond |

## Key Features

**Precision**: Time, timestamp, and interval types accept optional precision values (0-6) specifying fractional seconds digits.

**Interval Fields**: The interval type allows field restrictions using phrases like `YEAR TO MONTH`, `DAY TO SECOND`, etc.

**Input Formats**: PostgreSQL accepts diverse date/time formats including ISO 8601, SQL-compatible, and traditional formats. The `DateStyle` parameter controls day/month/year interpretation (MDY, DMY, or YMD).

**Output Styles**: Four output formats available—ISO 8601, SQL, Postgres, and German—controlled by the `DateStyle` setting.

**Time Zone Handling**: All timezone-aware values store internally as UTC, converting to local time for display based on the `TimeZone` configuration parameter.

**Special Values**: Keywords like `now`, `today`, `tomorrow`, `epoch`, and `infinity` provide convenient shortcuts.
