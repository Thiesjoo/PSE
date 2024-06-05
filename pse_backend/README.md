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
