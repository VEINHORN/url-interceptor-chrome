#!/bin/sh
#
# by VEINHORN, 2015
#


if [ ! -d "$(pwd)/temp" ]; then
	mkdir temp/
fi

wget -O temp/bootstrap.zip "https://github.com/twbs/bootstrap/releases/download/v3.3.6/bootstrap-3.3.6-dist.zip"
unzip temp/bootstrap.zip -d temp/bootstrap
