echo 'Building pbplayer'

cd src/container/flash/
~/Sites/flex/flex_sdk_4.1/bin/mxmlc pbplayer.as -static-link-runtime-shared-libraries -o ../../../dist/pbplayer.swf 

cd ../flash-shoutcast
~/Sites/flex/flex_sdk_4.1/bin/mxmlc pbstreamplayer.as -static-link-runtime-shared-libraries -o ../../../dist/pbstreamplayer.swf 
