
To make the backend work, don't forget to create a .env file and write the following in it:
```.env
SECRET_KEY=<your secret key>
```

Also, make sure to install the dependencies in requirements.txt

To install/run the server, and to create an admin account:

```
python3 manage.py migrate
python3 manage.py createsuperuser
python3 manage.py runserver
```

After making changes to any models, run the following:
```
python3 manage.py makemigrations
python3 manage.py migrate
```

Django-crontab commands:

For updating, seeing or removing crons:
```
python3 manage.py crontab add
python3 manage.py crontab show
python3 manage.py crontab remove
```