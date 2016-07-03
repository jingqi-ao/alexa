#!/bin/bash

# Based on Amazon Alexa sample app

mkdir -p certs/ca/
mkdir -p certs/server/

# Generate CA
openssl genrsa -out certs/ca/ca.key 4096
COMMON_NAME="My CA" openssl req -new -x509 -days 365 -key certs/ca/ca.key -out certs/ca/ca.crt -config ssl.cnf -sha256

# Create the KeyPair for the Node.js Companion Service
openssl genrsa -out certs/server/node.key 2048
COMMON_NAME="localhost" openssl req -new -key certs/server/node.key -out certs/server/node.csr -config ssl.cnf -sha256
openssl x509 -req -days 365 -in certs/server/node.csr -CA certs/ca/ca.crt -CAkey certs/ca/ca.key -set_serial 02 -out certs/server/node.crt -sha256
