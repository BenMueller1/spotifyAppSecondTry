from rest_framework import serializers

# if i can't get this to work just add a serialize() function to the Token model
class SpotifyTokenSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField()
    refresh_token = serializers.CharField(max_length=150)
    access_token = serializers.CharField(max_length=150)
    token_type = serializers.CharField(max_length=50)
    expires_in = serializers.DateTimeField()


# class SpotifyToken(models.Model):
#     created_at = models.DateTimeField(auto_now_add=True)
#     refresh_token = models.CharField(max_length=150)
#     access_token = models.CharField(max_length=150)
#     token_type = models.CharField(max_length=50)
#     expires_in = models.DateTimeField()