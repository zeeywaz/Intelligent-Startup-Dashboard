cd "C:\Zeidh type shi\College\Year3\applied project\code2\Intelligent-Startup-Dashboard"

# 1) Create start.sh with the correct content
$script = @'
#!/bin/bash
set -e
echo "🚀 Deploy start.sh: move to backend and install deps"
cd backend

# Install dependencies (use pip wheel/cache on CI if desired)
pip install -r requirements.txt

# Run migrations and collect static assets (safe for CI)
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Start gunicorn (bind to $PORT provided by host)
exec gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3
'@
Set-Content -Path .\start.sh -Value $script -Encoding UTF8

# 2) Create builder.config.json so Railpack uses bash start.sh
$builder = @'
{
  "build": "cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput",
  "start": "bash ./start.sh"
}
'@
Set-Content -Path .\builder.config.json -Value $builder -Encoding UTF8

# 3) Stage files and commit
git add start.sh builder.config.json
git commit -m "Add start.sh and builder.config.json for Railway deployment" || Write-Host "No changes to commit."

# 4) Rebase remote changes and push
git pull origin applied --rebase
git push origin applied
