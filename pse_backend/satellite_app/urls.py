from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("categories", views.categories, name="categories"),
    path("launch_years", views.launch_years, name="launch_years"),
    path("countries", views.countries, name="countries"),
    path("pull", views.pull, name="pull"),
]
