from django.urls import path, include
from . import views

urlpatterns = [
    path("get-auth-url", views.get_auth_url, name="get_auth_url"),
    path("callback-to-get-token", views.callback_to_get_token, name="callback_to_get_token"),
    path("get-most-recently-added-token", views.get_most_recently_added_token, name="get_most_recently_added_token")
]