docker build -t cinebaianos-web -f docker/Dockerfile .
docker run -d --name cinebaianos-web -p 3000:80 cinebaianos-web