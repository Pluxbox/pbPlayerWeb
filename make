echo 'Building pbplayer'

/opt/local/bin/sprocketize src/pbplayer.js > bin/pbplayer.js

cd src/containers/flash/
#~/Sites/flex/flex_sdk_4.1/bin/mxmlc pbplayer.as -static-link-runtime-shared-libraries -o ../../../bin/flex/pbplayer.swf 
#~/Sites/flex/flex_sdk_4.1/bin/mxmlc pbstreamplayer.as -static-link-runtime-shared-libraries -o ../../../bin/flex/pbstreamplayer.swf