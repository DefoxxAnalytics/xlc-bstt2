"""
URL configuration for BSTT Compliance Dashboard.
"""
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.admin import bstt_admin_site


@api_view(['GET'])
def api_root(request):
    """API root endpoint."""
    return Response({
        'message': 'BSTT Compliance Dashboard API',
        'endpoints': {
            'time-entries': '/api/time-entries/',
            'kpis': '/api/kpis/',
            'reports': '/api/reports/',
            'filters': '/api/filters/options/',
            'admin': '/admin/',
            'database-management': '/admin/database-management/',
        }
    })


@api_view(['GET'])
def health_check(request):
    """Health check endpoint for Docker."""
    return Response({'status': 'healthy'})


urlpatterns = [
    path('admin/', bstt_admin_site.urls),
    path('api/', api_root, name='api-root'),
    path('api/health/', health_check, name='health-check'),
    path('api/', include('core.urls')),
    path('api/kpis/', include('kpis.urls')),
    path('api/reports/', include('reports.urls')),
]
