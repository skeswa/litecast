package main

import (
	"fmt"
	"gopkg.in/alecthomas/kingpin.v1"
	"os"
)

const (
	EXECUTABLE_VERSION = "0.0.1"
)

var (
	executable = kingpin.New("litecast", "Litecast si a low-bandwidth, video-conferencing application for your terminal. To get started, use the 'register' command to secure a nick.")

	registerCommand = executable.Command("register", "Register a litecast nick for yourself.")
	registerNick    = registerCommand.Arg("nick", "Your litecast nick - put some thought into it.").Required().String()
	registerName    = registerCommand.Arg("name", "The name that people will see when you call them.").Required().String()
	registerPhone   = registerCommand.Arg("phone", "Your personal phone number - don't worry, its safe with us.").Required().String()

	callCommand = executable.Command("call", "Start a call with the litecast user matching the provided nick.")
	callNick    = callCommand.Arg("target", "The nick of the litecast call target.").Required().String()

	waitCommand = executable.Command("", "Wait to be called by another litecast user.")
)

func main() {
	kingpin.Version(EXECUTABLE_VERSION)

	switch kingpin.MustParse(executable.Parse(os.Args[1:])) {
	case registerCommand.FullCommand():
		fmt.Println("register", *registerNick, *registerName, *registerPhone)

	case callCommand.FullCommand():
		fmt.Println("call", *callNick)

	case waitCommand.FullCommand():
		fmt.Println("wait")
	}
}
