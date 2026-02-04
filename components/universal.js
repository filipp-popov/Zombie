/**
 * Created by ����� on 10.09.2015.
 */

var universal ={};


universal.writeRelay1 = function(address, value) {

    if (value == 0 || 1) {
        global.boardsTable[address][0] = (global.boardsTable[address][0] & ~(1<<7)) | (value << 7);
    }
    else{
        console.log('Universal board Relay1 Error: Undefined value');
        console.log('Address:', address);
        console.log('Value:', value);
    }
};

universal.writeRelay2 = function(address, value) {

    if (value == 0 || 1) {
        global.boardsTable[address][0] = (global.boardsTable[address][0] & ~(1<<6)) | (value << 6);
    }
    else{
        console.log('Universal board Relay2 Error: Undefined value');
        console.log('Address:', address);
        console.log('Value:', value);
    }
};

universal.writeLock1 = function(address, value) {

    if (value == 0 || 1) {
        global.boardsTable[address][0] = (global.boardsTable[address][0] & ~(1<<5)) | (value << 5);
    }
    else{
        console.log('Universal board Lock1 Error: Undefined value');
        console.log('Address:', address);
        console.log('Value:', value);
    }
};

universal.writeLock2 = function(address, value) {

    if (value == 0 || 1) {
        global.boardsTable[address][0] = (global.boardsTable[address][0] & ~(1<<4)) | (value << 4);
    }
    else{
        console.log('Universal board Lock2 Error: Undefined value');
        console.log('Address:', address);
        console.log('Value:', value);
    }
};

universal.writeOut1 = function(address, value) {

    if (value == 0 || 1) {
        global.boardsTable[address][0] = (global.boardsTable[address][0] & ~(1<<1)) | (value << 1);
    }
    else{
        console.log('Universal board Out1 Error: Undefined value');
        console.log('Address:', address);
        console.log('Value:', value);
    }
};

universal.writeOut2 = function(address, value) {

    if (value == 0 || 1) {
        global.boardsTable[address][0] = (global.boardsTable[address][0] & ~1) | value;
    }
    else{
        console.log('Universal Board Out2 Error: Undefined value');
        console.log('Address:', address);
        console.log('Value:', value);
    }
};

universal.readRelay1 = function(address) {
    return((global.boardsTable[address][0] >> 7) & 1);
};

universal.readRelay2 = function(address) {
    return((global.boardsTable[address][0] >> 6) & 1);
};

universal.readLock1 = function(address) {
    return((global.boardsTable[address][0] >> 5) & 1);
};

universal.readLock2 = function(address) {
    return((global.boardsTable[address][0] >> 4) & 1);
};

universal.readIn1 = function(address) {
    return((global.boardsTable[address][0] >> 3) & 1);
};

universal.readIn2 = function(address) {
    return((global.boardsTable[address][0] >> 2) & 1);
};

universal.readOut1 = function(address) {
    return((global.boardsTable[address][0] >> 1) & 1);
};

universal.readOut2 = function(address) {
    return(global.boardsTable[address][0] & 1);
};

universal.readRFID = function(address) {
    return((global.boardsTable[address][1] << 16) + (global.boardsTable[address][2] << 8) + global.boardsTable[address][3]);
};

module.exports = universal;