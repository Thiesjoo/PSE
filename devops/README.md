# Devops

Our app is hosted in a simple VM, and we use a few tools to manage it.

## Cloudflared

Because we do not want to expose our VM to the internet, we use Cloudflared to tunnel the traffic from Cloudflare to our VM. This way, we specify:
- satradar.space -> localhost:8000
- api.satradar.space -> localhost:8001

### Backend

The backend has some static files, for the django admin, we use NGINX to serve these.
For this we use a simple nginx.conf file, found in the same folder as this README.

## Github CI/CD

The CI/CD pipeline is managed by Github Actions. We have a few workflows:
- build backend (on changes on backend)
- build frontend (on changes on frontend)

These workflows build the docker images and push them to the Github Container Registry.
When 1 of these is finished, we execute the deploy workflow, which pulls the images from the registry and restarts the containers, found in .github/deploy.tml

We also have a simple action to post a Discord message, when there is a push to main.