#!/bin/bash

if [ "$(id -u)" == "0" ]
then
    echo " [!] Don't run by root!"
fi

BIN=/usr/local/bin/node
BIN_ARGS="--harmony bin/www"
WAIT_STOP_PID=60
STORAGE_DIR=storage/
PIDFILE=${STORAGE_DIR}process.pid
LOGFILE=${STORAGE_DIR}process.log

cd $(dirname $(readlink -f $0))

if [ ! -d "$STORAGE_DIR" ]
then
    echo " [x] Storage dir ($STORAGE_DIR) not exist!"
    exit 1
fi

function get_pid()
{
    if [ -f "$PIDFILE" ]
    then
        PID=`cat ${PIDFILE}`
        if [ -z "$PID" ]
        then
            rm -f ${PIDFILE}
        else
            if ps -p ${PID} > /dev/null 2>&1
            then
                echo ${PID}
            else
                rm -f ${PIDFILE}
            fi
        fi
    else
        rm -f ${PIDFILE}
    fi
}

function start()
{
    PID=$(get_pid)

    if [ -z "$PID" ]
    then
        echo " [ ] Starting..."
        ${BIN} ${BIN_ARGS} >> ${LOGFILE} 2>&1 &
        RUN_PID=$!

        if [ -z "$RUN_PID" ]
        then
            echo " [!] Fail start daemon!"
        else
            echo " [ ] Check starting..."
            sleep 1
            if ps -p ${RUN_PID} > /dev/null 2>&1
            then
                echo ${RUN_PID} > ${PIDFILE}if
                echo " [+] Success UP, pid: $RUN_PID!"
            else
                echo " [!] Fail start!"
                exit 1
            fi
        fi
    else
        echo " [+] Daemon is started! pid: $PID"
    fi
}

function stop()
{
    PID=$(get_pid)

    if [ -z "$PID" ]
    then
        echo " [-] Daemon is stopped"
    else
        kill ${PID}

        echo " [ ] Waiting stop the daemon, pid $PID..."

        PID=$(get_pid)
        i=1
        while ! [ -z "$PID" ]; do
            if [[ ${i} -ge ${WAIT_STOP_PID} ]]; then
                echo " [!] Fail stop daemon by timeout $WAIT_STOP_PID!"
                exit 1
            fi

            PID=$(get_pid)

            i=$(( $i+1 ))
            sleep 1
        done

        rm -f ${PIDFILE}
        echo " [+] Success stop!"
    fi
}

function force_stop()
{
    PID=$(get_pid)

    if [ -z "$PID" ]
    then
        echo " [+] Daemon is stopped"
    else
        kill -9 ${PID}
        PID=$(get_pid)
        if [ -z "$PID" ]
        then
            rm -f ${PIDFILE}
            echo " [+] Success stop!"
        else
            echo " [!] Fail stop, pid $PID!"
            exit 1;
        fi
    fi
}

function status()
{
    PID=$(get_pid)

    if [ -z "$PID" ]
    then
        echo " [-] Daemon is DOWN"
    else
        echo " [+] Daemon is IP, pid: $PID"
    fi
}

function usage()
{
    echo
    echo " Usage: ${BASH_SOURCE[0]} <command>"
    echo
    echo "   commands:"
    echo "      - start"
    echo "      - stop"
    echo "      - force-stop"
    echo "      - status"
    echo "      - restart"
    echo
}

case "$1" in
    start)
         start
         ;;
    stop)
         stop
         ;;
    restart)
         stop
         start
         ;;
    status)
        status
        ;;
    force-stop)
        force_stop
        ;;
    *)
        echo " [x] Command not found"
        usage
        exit 1
        ;;
esac

exit