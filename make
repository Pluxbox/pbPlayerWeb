echo 'Building pbPlayer'

/opt/local/bin/sprocketize src/pbplayer.js > bin/pbplayer3.js

cd src/flex/

#~/Sites/flex/flex_sdk_4.1/bin/mxmlc pbplayer.as -static-link-runtime-shared-libraries -o ../../bin/flex/pbplayer.swf 
#~/Sites/flex/flex_sdk_4.1/bin/mxmlc pbstreamplayer.as -static-link-runtime-shared-libraries -o ../../bin/flex/pbstreamplayer.swf