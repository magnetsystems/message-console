#/usr/bin/bash

### INIT ###
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR

if (( "$#" != 2 )) 
then
    echo "Usage: $0 app_name app_version, e.g. $0 devcenter 1.0.0"
exit 1
fi

APP_NAME=$1
APP_VERSION=$2


### BUILD ###
npm install

### PACKAGE ###
# collect temp files in target dir  (maven standard)
mkdir -p target/
cd target/

#create dir for packaging
mkdir $APP_NAME-$APP_VERSION
cd $APP_NAME-$APP_VERSION

#create links to things to be packaged
ln -s $SCRIPT_DIR/css
ln -s $SCRIPT_DIR/fonts
ln -s $SCRIPT_DIR/images
ln -s $SCRIPT_DIR/js
ln -s $SCRIPT_DIR/index.html

#create the tar!
cd ..
tar czfh $APP_NAME-$APP_VERSION.tar.gz $APP_NAME-$APP_VERSION/*

