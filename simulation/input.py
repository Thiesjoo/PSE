from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def get_data_from_html(request):
    if request.method == 'POST':
        slider_value = request.POST.get('sliderValue')
        print("Slider value is " + slider_value)
        # Here you can create an object with slider_value
        # For example:
        # my_object = MyClass(slider_value)
        return HttpResponse("Data sent. Please check your program log")