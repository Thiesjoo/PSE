python3 manage.py migrate
python3 manage.py crontab add
python3 manage.py crontab show

/etc/init.d/cron start
gunicorn pse_backend.wsgi:application --bind 0.0.0.0:8000 --workers 4