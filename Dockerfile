
FROM python:3.10
WORKDIR /usr/src/app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8080
CMD ["python", "app.py"]

#----------------------------
# Google Compute Engine Steps
#----------------------------
# (1) Containerize Program: ***

#   docker build -t phaser2d-image . (add)
#   docker rmi phaser2d-image (delete)
#   docker run -d --name phaser2d-container -P phaser2d-image (run locally)

# (2) Deploy Container to GCP Artifact Registry: ***

#   gcloud builds submit --tag gcr.io/a3-gochezjo/phaser2d-image .

# (3) Configure Artifact Registry:

#   Enable Cloud Build API, Artifact Registry API, Compute Engine API
#   Copy Image Path: gcr.io/a3-gochezjo/phaser2d-image
#   Select correct Image on Path

# (4) Create a VM Instance: 

#   Machine type: e2-micro(2 vCPU, 1 core, 1 GB)
#   Container: gcr.io/a3-gochezjo/phaser2d-image
#   Firewall: HTTP, HTTPS

# (5) Create Firewall Rule: 

#   Go to VPC Network -> Firewall
#   Targets: All instances
#   IPv4 Range: 0.0.0.0/0
#   Protocol/Port: TCP: 5555

# (6) Access Program:

#   External IP/Port: 34.45.9.90:5555