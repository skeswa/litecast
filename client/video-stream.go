package main

import (
	"net"
)

const (
	SERVER_IP       = "127.0.0.1"
	SERVER_UDP_PORT = "4242"
)

var (
	udpConn *net.UDPConn
)

func punchHole() error {
	serverAddr := net.ResolveUDPAddr("udp4", SERVER_IP+":"+SERVER_UDP_PORT)
	udpConn, err := net.DialUDP("udp4", nil, serverAddr)
	if err {
		return err
	}
	return nil
}
