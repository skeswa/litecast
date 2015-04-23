package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"time"
)

const (
	SERVER_UDP_PORT = "4242"
	// Buffer should be around 4 MB
	MESSAGE_BUFFER_SIZE    = 1024 * 1024 * 4
	INC_MESSAGE_QUEUE_SIZE = 100
	OUT_MESSAGE_QUEUE_SIZE = 100
	ACK_RETRY_PAUSE_MS     = 50
	ACK_RETRY_LIMIT        = 5
	// Message types
	MSG_IDENTITY    = "identity"
	MSG_CALL        = "call"
	MSG_VIDEO_FRAME = "videoframe"
	MSG_HOLEPUNCH   = "holepunch"
	MSG_ACK         = "ack"
	// Message templates
	TEMPLATE_MSG_ACK       = "{\"type\":\"" + MSG_ACK + "\",\"id\":%d,\"data\":{\"success\":%s}}"
	TEMPLATE_MSG_HOLEPUNCH = "{\"type\":\"" + MSG_HOLEPUNCH + "\",\"id\":%d,\"data\":{\"handle\":\"%s\",\"ip\":\"%s\"}}"
)

var (
	conn                 *net.UDPConn
	buffer               = make([]byte, MESSAGE_BUFFER_SIZE)
	incomingMessageQueue = make(chan IncomingMessage, INC_MESSAGE_QUEUE_SIZE)
	outgoingMessageQueue = make(chan OutgoingMessage, OUT_MESSAGE_QUEUE_SIZE)
	addrMap              = make(map[string]*net.UDPAddr)
	messageRecordMap     = make(map[*net.UDPAddr]*MessageRecord)
)

/********** HELPER FUNCTIONS **********/

// Exits if an error occurs
func fatalIf(err error) {
	if err != nil {
		log.Fatalln("A fatal error occurred: ", err)
	}
}

// Send ACKs until activity is detected
func ack(messageId int, message OutgoingMessage) {
	var (
		initialMessageId int
		record           = messageRecordMap[message.addr]
		attempts         = 0
	)
	// Exit if the record doesn't exist
	if record == nil {
		return
	}
	// Otherwise, set the initialMessageId
	initialMessageId = record.messageId
	// Send the outgoing message until there is more activity from the addr
	for initialMessageId == record.messageId && attempts <= ACK_RETRY_LIMIT {
		outgoingMessageQueue <- message
		attempts = attempts + 1
		time.Sleep(ACK_RETRY_PAUSE_MS * time.Millisecond)
	}
}

// Sends success message back to sender
func respondWithSuccess(addr *net.UDPAddr, messageId int) {
	// Compose the outgoing message
	data := []byte(fmt.Sprintf(TEMPLATE_MSG_ACK, messageId, "true"))
	msg := OutgoingMessage{
		data:   data,
		length: len(data),
		addr:   addr,
	}
	// Send the message
	go ack(messageId, msg)
}

// Sends success message back to sender
func respondWithFailure(addr *net.UDPAddr, messageId int) {
	// Compose the outgoing message
	data := []byte(fmt.Sprintf(TEMPLATE_MSG_ACK, messageId, "false"))
	msg := OutgoingMessage{
		data:   data,
		length: len(data),
		addr:   addr,
	}
	// Send the message
	go ack(messageId, msg)
}

/*************** TYPES ****************/

type IncomingMessage struct {
	data   []byte
	length int
	addr   *net.UDPAddr
}

type OutgoingMessage struct {
	data   []byte
	length int
	addr   *net.UDPAddr
}

type MessageWrapper struct {
	MessageId      int             `json:"id"`
	MessageType    string          `json:"type"`
	MessagePayload json.RawMessage `json:"data"`
}

type IncomingIdentityMessage struct {
	Handle string `json:"handle"`
}

type IncomingCallMessage struct {
	InitiatorHandle string `json:"handle"`
	TargetHandle    string `json:"target"`
}

type MessageRecord struct {
	timestamp int64
	messageId int
}

/********** MESSAGE HANDLERS **********/

func handleIdentityMessage(addr *net.UDPAddr, msgId int, msg IncomingIdentityMessage) {
	addrMap[msg.Handle] = addr
	// Send a successful response
	respondWithSuccess(addr, msgId)
}

func handleCallMessage(addr *net.UDPAddr, msgId int, msg IncomingCallMessage) {
	var initiatorAddr, targetAddr *net.UDPAddr
	initiatorAddr = addrMap[msg.InitiatorHandle]
	targetAddr = addrMap[msg.TargetHandle]
	// Exit if either of the addresses don't exist
	if initiatorAddr == nil || targetAddr == nil {
		respondWithFailure(addr, msgId)
		return
	}
	// Send response, then send holepunch messages
	respondWithSuccess(addr, msgId)
	// Send the holepunch message to the initiator
	outgoingMsgBuffer := []byte(fmt.Sprintf(TEMPLATE_MSG_HOLEPUNCH, -1, msg.TargetHandle, targetAddr.IP))
	outgoingMsg := OutgoingMessage{
		data:   outgoingMsgBuffer,
		length: len(outgoingMsgBuffer),
		addr:   initiatorAddr,
	}
	go ack(-1, outgoingMsg)
	// Send the holepunch message to the target
	outgoingMsgBuffer = []byte(fmt.Sprintf(TEMPLATE_MSG_HOLEPUNCH, -1, msg.InitiatorHandle, initiatorAddr.IP))
	outgoingMsg = OutgoingMessage{
		data:   outgoingMsgBuffer,
		length: len(outgoingMsgBuffer),
		addr:   targetAddr,
	}
	go ack(-1, outgoingMsg)
}

/************ GO-ROUTINES *************/

// Listens for incoming messages; puts them in the queue
func listen() {
	addr, err := net.ResolveUDPAddr("udp", ":"+SERVER_UDP_PORT)
	fatalIf(err)
	// Listen for incoming UDP conns.
	conn, err = net.ListenUDP("udp", addr)
	fatalIf(err)
	// Stop listening on exit
	defer conn.Close()
	defer close(incomingMessageQueue)
	// Listen for messages on a loop
	for {
		bytes, packetAddr, err := conn.ReadFromUDP(buffer)
		if err == nil {
			// Copy the part that we read for processing
			messageBuffer := make([]byte, bytes)
			copy(buffer[0:bytes], messageBuffer[:])
			// Put it in the message channel
			incomingMessageQueue <- IncomingMessage{messageBuffer, bytes, packetAddr}
		} else {
			// Log the connection error
			log.Println("Failed to read from UDP: ", err)
		}
	}
}

// Parses messages from the incoming queue
func parse() {
	for {
		incomingMessage, queueClosed := <-incomingMessageQueue
		if !queueClosed {
			// Parse the message
			var wrapper = MessageWrapper{}
			err := json.Unmarshal(incomingMessage.data[0:incomingMessage.length], &wrapper)
			if err != nil {
				log.Println("Failed to parse UDP message: ", err)
				break
			} else {
				// Record the packet
				record := messageRecordMap[incomingMessage.addr]
				if record == nil {
					record = &MessageRecord{
						timestamp: time.Now().UnixNano(),
						messageId: wrapper.MessageId,
					}
					// Put it in the map
					messageRecordMap[incomingMessage.addr] = record
				} else {
					record.timestamp = time.Now().UnixNano()
					record.messageId = wrapper.MessageId
				}
				// Evaluate the packet data
				switch wrapper.MessageType {
				case MSG_IDENTITY:
					var message IncomingIdentityMessage
					err = json.Unmarshal(wrapper.MessagePayload, &message)
					if err != nil {
						log.Println("Failed to parse identity message: ", err)
						// Send an unsuccessful response
						respondWithFailure(incomingMessage.addr, wrapper.MessageId)
					} else {
						handleIdentityMessage(incomingMessage.addr, wrapper.MessageId, message)
					}
				case MSG_CALL:
					var message IncomingCallMessage
					err = json.Unmarshal(wrapper.MessagePayload, &message)
					if err != nil {
						log.Println("Failed to parse identity message: ", err)
						// Send an unsuccessful response
						respondWithFailure(incomingMessage.addr, wrapper.MessageId)
					} else {
						handleCallMessage(incomingMessage.addr, wrapper.MessageId, message)
					}
				}
			}
		} else {
			return
		}
	}
}

// Sends messages from the outgoing queue
func send() {
	for {
		outgoingMessage, queueClosed := <-outgoingMessageQueue
		if !queueClosed {
			// Sends the message
			conn.WriteTo(outgoingMessage.data, outgoingMessage.addr)
		} else {
			return
		}
	}
}

func main() {
	go listen()
	go parse()
	go send()
	// Log that the server is listening
	log.Println("UDP server is listening on port " + SERVER_UDP_PORT)
	// Block forever
	select {}
}
