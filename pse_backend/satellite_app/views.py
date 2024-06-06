from django.shortcuts import render

# Create your views here.

from django.http import HttpResponse, HttpRequest

def index(request: HttpRequest):
    print(request.GET)
    return HttpResponse("Some placeholder text.", content_type="text/plain")
