# BSTT Compliance Dashboard

A modern web application for tracking and analyzing biometric time tracking compliance across multiple offices. Built with Django REST Framework and React TypeScript.

## Features

- **Executive Dashboard**: Real-time KPIs including finger scan rates, provisional entries, write-ins, and missing clock-outs
- **Office Analysis**: Compare compliance metrics across offices with ranking, department, and shift breakdowns
- **Entry Type Analysis**: Visualize distribution of entry types with weekly trends
- **Employee Analysis**: Track individual employee compliance and identify enrollment needs
- **Weekly Trends**: Historical compliance data with week-over-week comparisons
- **Clock Behavior**: Analyze clock-in/out attempts and identify training needs
- **Data Explorer**: Browse and export raw time entry data
- **Excel Report Generation**: Export comprehensive reports matching BSTT-rpt.xlsx format

## Tech Stack

### Backend
- Python 3.11+
- Django 4.2+
- Django REST Framework
- SQLite (development) / PostgreSQL (production)
- Pandas for data processing
- OpenPyXL for Excel generation

### Frontend
- React 18 with TypeScript
- Recharts for data visualization
- Tailwind CSS for styling
- Axios for API communication

### Infrastructure
- Docker & Docker Compose
- Nginx (production)
- Gunicorn (WSGI server)

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/your-org/bstt-web.git
cd bstt-web
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Build and run:
```bash
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:8000/api
- Admin Panel: http://localhost:8000/admin

### Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Load initial data (if available)
python manage.py sync_csv --year 2025

# Start development server
python manage.py runserver
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Project Structure

```
bstt-web/
├── backend/                 # Django backend
│   ├── config/             # Django project settings
│   ├── core/               # Core app (models, admin, filters)
│   ├── kpis/               # KPI calculations and API
│   ├── reports/            # Excel report generation
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript types
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .gitignore
└── README.md
```

## API Endpoints

### KPIs
| Endpoint | Description |
|----------|-------------|
| `GET /api/kpis/` | Aggregate KPIs with filters |
| `GET /api/kpis/by-office/` | KPIs grouped by office |
| `GET /api/kpis/by-week/` | Weekly KPI trends |
| `GET /api/kpis/by-department/` | KPIs by department |
| `GET /api/kpis/by-shift/` | KPIs by shift |
| `GET /api/kpis/by-employee/` | Employee-level metrics |
| `GET /api/kpis/clock-behavior/` | Clock attempt analysis |

### Data
| Endpoint | Description |
|----------|-------------|
| `GET /api/time-entries/` | Paginated time entries |
| `GET /api/filters/options/` | Available filter options |
| `GET /api/data-quality/` | Data freshness indicators |

### Reports
| Endpoint | Description |
|----------|-------------|
| `GET /api/reports/full/` | Download full Excel report |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Django debug mode | `False` |
| `SECRET_KEY` | Django secret key | Required |
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost` |
| `CORS_ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` |
| `DATABASE_URL` | Database connection | SQLite |

### Data Import

To import time entry data:

```bash
# From CSV files
python manage.py sync_csv --year 2025

# Or upload via Django Admin panel
```

## Development

### Running Tests

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

### Code Style

- Backend: Follow PEP 8
- Frontend: ESLint + Prettier

## Deployment

### Production Checklist

1. Set `DEBUG=False`
2. Generate a strong `SECRET_KEY`
3. Configure `ALLOWED_HOSTS`
4. Set up HTTPS/SSL
5. Configure database (PostgreSQL recommended)
6. Set up monitoring and logging
7. Configure backup strategy

### Docker Production Build

```bash
docker-compose up --build -d
```

## License

Proprietary - XLC Services

## Support

For issues and feature requests, contact the development team.
