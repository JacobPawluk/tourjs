tsc

SIGNIN=art@172.105.28.136
APIHOSTDIR=/home/art/tourjs-api

ssh $SIGNIN "mkdir -p $APIHOSTDIR"
scp -r dist/* $SIGNIN:$APIHOSTDIR
scp pm2.json $SIGNIN:$APIHOSTDIR/pm2.json
scp ssl-config.json $SIGNIN:$APIHOSTDIR/ssl-config.json
scp package.json $SIGNIN:$APIHOSTDIR/package.json
ssh $SIGNIN "cd $APIHOSTDIR && npm install && pm2 restart pm2.json"
echo "Should be deployed!"