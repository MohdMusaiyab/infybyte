package utils

import (
	"encoding/json"
	"log"

	"github.com/MohdMusaiyab/infybyte/server/internal/models"
	"github.com/MohdMusaiyab/infybyte/server/internal/websocket"
)

var websocketHub *websocket.Hub

type BroadcastMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
	Action  string      `json:"action"`
}

func SetWebSocketHub(hub *websocket.Hub) {
	websocketHub = hub
}

func BroadcastItemFoodCourtUpdate(itemFoodCourt models.ItemFoodCourt, action string) {
	if websocketHub == nil {
		log.Println("WebSocket hub not initialized")
		return
	}

	message := BroadcastMessage{
		Type:    "item_foodcourt_update",
		Payload: itemFoodCourt,
		Action:  action,
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	websocketHub.Broadcast <- messageBytes
	log.Printf("Broadcasted ItemFoodCourt update: %s (ID: %s)", action, itemFoodCourt.ID.Hex())
}
