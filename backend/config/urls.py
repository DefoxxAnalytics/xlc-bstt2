"""
URL configuration for BSTT Compliance Dashboard.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response


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
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/', include('core.urls')),
    path('api/kpis/', include('kpis.urls')),
    path('api/reports/', include('reports.urls')),
]
