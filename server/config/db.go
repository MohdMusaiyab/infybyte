package config

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client

func ConnectDB() *mongo.Client {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("MONGO_URI is not set in .env file")
	}

	client, err := mongo.NewClient(options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal("Error creating MongoDB client:", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal("Error connecting to MongoDB:", err)
	}
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Could not ping MongoDB:", err)
	}

	log.Println("✅ Connected to MongoDB Atlas")
	MongoClient = client
	return client
}

func GetCollection(databaseName, collectionName string) *mongo.Collection {
	return MongoClient.Database(databaseName).Collection(collectionName)
}

func EnsureIndexes(db *mongo.Database) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if _, err := db.Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}); err != nil {
		log.Printf("Warning: users.email index: %v", err)
	}

	if _, err := db.Collection("vendors").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	}); err != nil {
		log.Printf("Warning: vendors.user_id index: %v", err)
	}

	if _, err := db.Collection("itemfoodcourts").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "foodcourt_id", Value: 1}, {Key: "item_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "item_id", Value: 1}},
		},
	}); err != nil {
		log.Printf("Warning: itemfoodcourts indexes: %v", err)
	}

	if _, err := db.Collection("managers").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "foodcourt_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "vendor_id", Value: 1}},
		},
	}); err != nil {
		log.Printf("Warning: managers indexes: %v", err)
	}

	if _, err := db.Collection("items").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "vendor_id", Value: 1}},
	}); err != nil {
		log.Printf("Warning: items.vendor_id index: %v", err)
	}

	return nil
}
