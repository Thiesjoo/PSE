Run server en maak admin account.

```
python3 manage.py migrate
python3 manage.py createsuperuser
python3 manage.py runserver
```

Als je de models aanpast:

```
python3 manage.py makemigrations
python3 manage.py migrate
```

Django-crontab commands:

Om de alle crons te updaten, te zien, of te removen:
```
python3 manage.py crontab add
python3 manage.py crontab show
python3 manage.py crontab remove
```