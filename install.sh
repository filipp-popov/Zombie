#!/bin/bash

if [ "$(id -u)" == "0" ]
then
    echo " [!] Don't run by root!"
fi

chmod 777 $(dirname $(readlink -f $0))
cd $(dirname $(readlink -f $0))

chmod +x run.sh
mkdir -p storage/
echo "en" > language.txt
chmod +rw language.txt