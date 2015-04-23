package main

import "gopkg.in/alecthomas/kingpin.v1"

var (
	cli = kingpin.New("litecast", "A low-bandwidth, video-conferencing application for your terminal")

	registerCommand = cli.Command("register", "Register a litecast nick for yourself")
	registerNick    = registerCommand.Arg("nick", "Your litecast nick - put some thought into it").Required().String()
	registerName    = registerCommand.Arg("name", "The name that people will see when you call them").Required().String()
	registerPhone   = registerCommand.Arg("phone", "Your personal phone number - don't worry, its safe with us").Required().String()

	callCommand = cli.Command("call", "Start a call with the litecast user matching the provided nick")
	callNick    = call.Arg("target", "The nick of the litecast call target").Required().String()
)

func ReadArguments() {
	// Validate the phone number

}
