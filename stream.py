from threading import Thread
import Queue
import socket

from message_parser import parse_incoming_message

DATA_BUFFER_SIZE = 10240
IN_BUFFER_SIZE = 1024
# SERVER_URL = 'litecst.cloudapp.net'
SERVER_URL = '127.0.0.1'

def thread_read_stream(conn):
    sock = conn.sock

    cursor = 0
    databuff = bytearray(DATA_BUFFER_SIZE)
    inbuff = bytearray(IN_BUFFER_SIZE)
    inview = memoryview(inbuff)
    dataview = memoryview(databuff)

    while conn.working:
        count = sock.recv_into(inview, IN_BUFFER_SIZE)
        for i in xrange(count):
            byte = inbuff[i]
            if byte is 0:
                parse_incoming_message((databuff[:cursor]).decode('utf-8'))
                cursor = 0
            else:
                if cursor >= len(databuff):
                    newdatabuff = bytearray(len(databuff) * 2)
                    newdatabuff[:] = databuff
                    databuff = newdatabuff
                databuff[cursor] = byte
                cursor = cursor + 1

def thread_write_stream(conn):
    sock = conn.sock
    queue = conn.outQueue

    while conn.working:
        print('Waiting for stuff to write...')
        payload = queue.get(True, None)
        print('Writing...')
        sock.send(payload + '\x00')

class Connection:
    def __init__(self):
        # State variables
        self.working = True
        self.outQueue = Queue.Queue()
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # Thread decl.
        inThread = Thread(target = thread_read_stream, args = (self,))
        inThread.daemon = True
        outThread = Thread(target = thread_write_stream, args = (self,))
        outThread.daemon = True
        # Open TCP connection
        self.sock.connect((SERVER_URL, 4000))
        # Start the TCP threads
        inThread.start()
        outThread.start()

    def write(self, payload):
        print('Queuing stuff to write...')
        self.outQueue.put(payload)

    def stop(self):
        self.working = False
