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

	foodCourtTopic := "foodcourt:" + itemFoodCourt.FoodCourtID.Hex()
	websocketHub.BroadcastToTopic(foodCourtTopic, messageBytes)
	log.Printf("Broadcasted ItemFoodCourt update: %s (Topic: %s, ID: %s)", action, foodCourtTopic, itemFoodCourt.ID.Hex())
}

func BroadcastUserRoleUpdate(userID string, newRole string) {
	if websocketHub == nil {
		log.Println("WebSocket hub not initialized")
		return
	}

	message := BroadcastMessage{
		Type: "role_change",
		Payload: map[string]string{
			"role": newRole,
		},
		Action: "update",
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling role_change message: %v", err)
		return
	}

	topic := "user:" + userID
	websocketHub.BroadcastToTopic(topic, messageBytes)
	log.Printf("Broadcasted user role update: %s -> %s", userID, newRole)
}
