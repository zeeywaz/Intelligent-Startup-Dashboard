from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection

@api_view(["GET"])
def db_health(request):
    with connection.cursor() as cur:
        cur.execute("SELECT 1;")
        ok = cur.fetchone()[0] == 1
    return Response({"db": "ok" if ok else "fail"})
