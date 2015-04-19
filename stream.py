from threading import Thread
import time
import Queue
import socket

from message_parser import parse_incoming_message

DATA_BUFFER_SIZE = 10240
IN_BUFFER_SIZE = 1024
databuff = bytearray(DATA_BUFFER_SIZE)
inbuff = bytearray(IN_BUFFER_SIZE)
inview = memoryview(inbuff)
dataview = memoryview(databuff)
cursor = 0
writequeue = Queue.Queue()

def thread_read_stream(sock):
    while True:
        time.sleep(1)
        count = sock.recv_into(inview, IN_BUFFER_SIZE)
        for i in xrange(count):
            byte = inbuff[i]
            if byte is 0:
                parse_incoming_message(databuff[:cursor])
                cursor = 0
            else:
                if cursor >= len(databuff):
                    newdatabuff = bytearray(len(databuff) * 2)
                    newdatabuff[:] = databuff
                    databuff = newdatabuff
                databuff[cursor] = byte
                cursor = cursor + 1

def thread_write_stream(sock):
    while True:
        payload = writequeue.get(True, None)
        sock.send(payload)

def write_to_stream(payload):
    writequeue.put(payload)

def connect():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('litecst.cloudapp.net', 4000))
    inThread = Thread(target = thread_read_stream, args = (sock,))
    outThread = Thread(target = thread_write_stream, args = (sock,))
