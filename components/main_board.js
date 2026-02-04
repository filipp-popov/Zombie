/**
 * Created by ����� on 10.09.2015.
 */

var main ={};

main.writeRelay = function(value) {

    if (value == 0 || 1) {
        global.boardsTable[0][0] = (global.boardsTable[0][0] & ~(1<<7)) | (value << 7);
    }
    else{
        console.log('Universal board Relay Error: Undefined value');
        console.log('Address:', 'main_board');
        console.log('Value:', value);
    }
};

main.writeOD1 = function(value) {

    if (value == 0 || 1) {
        global.boardsTable[0][0] = (global.boardsTable[0][0] & ~(1<<6)) | (value << 6);
    }
    else{
        console.log('Universal board Lock1 Error: Undefined value');
        console.log('Address:', 'main_board');
        console.log('Value:', value);
    }
};

main.writeOD2 = function(value) {

    if (value == 0 || 1) {
        global.boardsTable[0][0] = (global.boardsTable[0][0] & ~(1<<5)) | (value << 5);
    }
    else{
        console.log('Universal board Lock2 Error: Undefined value');
        console.log('Address:', 'main_board');
        console.log('Value:', value);
    }
};

main.writeOD3 = function(value) {

    if (value == 0 || 1) {
        global.boardsTable[0][0] = (global.boardsTable[0][0] & ~(1<<4)) | (value << 4);
    }
    else{
        console.log('Universal board Lock3 Error: Undefined value');
        console.log('Address:', 'main_board');
        console.log('Value:', value);
    }
};

main.writeOD4 = function(value) {

    if (value == 0 || 1) {
        global.boardsTable[0][0] = (global.boardsTable[0][0] & ~(1<<3)) | (value << 3);
    }
    else{
        console.log('Universal board Lock4 Error: Undefined value');
        console.log('Address:', 'main_board');
        console.log('Value:', value);
    }
};

main.writeOD5 = function(value) {

    if (value == 0 || 1) {
        global.boardsTable[0][0] = (global.boardsTable[0][0] & ~(1<<2)) | (value << 2);
    }
    else{
        console.log('Universal board Lock2 Error: Undefined value');
        console.log('Address:', 'main_board');
        console.log('Value:', value);
    }
};


main.readRelay = function() {
    return((global.boardsTable[0][0] >> 7) & 1);
};

main.readOD1 = function() {
    return((global.boardsTable[0][0] >> 6) & 1);
};

main.readOD2 = function() {
    return((global.boardsTable[0][0] >> 5) & 1);
};

main.readOD3 = function() {
    return((global.boardsTable[0][0] >> 4) & 1);
};

main.readOD4 = function() {
    return((global.boardsTable[0][0] >> 5) & 1);
};

main.readOD5 = function() {
    return((global.boardsTable[0][0] >> 4) & 1);
};

main.readIn1 = function() {
    return((global.boardsTable[0][0] >> 1) & 1);
};

main.readIn2 = function() {
    return((global.boardsTable[0][0]) & 1);
};

module.exports = main;