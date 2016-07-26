#! /bin/bash

PATH=/home/jao/node-v5.12.0-linux-x64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games

ALEXA_FULL_PATH=/home/jao/dev_github/alexa

PID_ALEXA_SERVER=$(ps aux | grep -v grep | grep 'alexa-server.js' | awk '{print $2}')

echo $PID_ALEXA_SERVER

kill $PID_ALEXA_SERVER || true

cd $ALEXA_FULL_PATH/companion-server/scripts
source alexa-server-set-env.sh

echo "ALEXA_SERVER_AVS_CLIENT_ID" >> /tmp/alexa-server-log
echo $ALEXA_SERVER_AVS_CLIENT_ID >> /tmp/alexa-server-log

cd $ALEXA_FULL_PATH/companion-server
nohup node alexa-server.js >> /tmp/alexa-server-log 2>&1 &