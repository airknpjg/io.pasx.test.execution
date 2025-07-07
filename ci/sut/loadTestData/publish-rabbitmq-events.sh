#!/bin/bash
####################################################################################################
# This script is used to publish messages to a RabbitMQ exchange from a JSON file or directory.
# The script requires the input path as the first argument.
# It is automatically called by the publishRabbitmqMessages gradle task, to publish the test data
#   to the SUT environment.
# It can also be used for development and debugging purposes. For this purpose, the script can be
#   run manually and a path or a json file can be provided as an argument.
####################################################################################################

# Define RabbitMQ server details
RABBITMQ_URL="http://localhost:15672/rabbitmq/api/exchanges/%2F/messages/publish"
EXCHANGE="messages"
USERNAME="pasx"
PASSWORD="pasx"

# Input path (file or directory) passed as an argument
INPUT_PATH="$1"

# Check if input path is provided
if [[ -z "$INPUT_PATH" ]]; then
  echo "Usage: $0 <input_file_or_directory>"
  exit 1
fi

# Function to process each JSON file and publish messages
process_json_file() {
  local json_file="$1"
  echo "Processing file: $json_file"

  # Read each message in the JSON file and publish it
  jq -c '.[]' "$json_file" | while read -r message; do
    # Extract necessary fields from each message
    properties=$(echo "$message" | jq '.properties')
    payload=$(echo "$message" | jq -r '.payload')
    payload_encoding=$(echo "$message" | jq -r '.payload_encoding')
    routing_key=$(echo "$message" | jq -r '.routing_key')
    message_id=$(echo "$message" | jq '.properties.message_id')

  # Construct the JSON payload for RabbitMQ
  curl_payload=$(jq -n --arg payload "$payload" \
                        --arg routing_key "$routing_key" \
                        --arg exchange "$EXCHANGE" \
                        --argjson properties "$properties" \
                        --arg payload_encoding "$payload_encoding" \
                        '{
                          "properties": $properties,
                          "routing_key": $routing_key,
                          "payload": $payload,
                          "payload_encoding": $payload_encoding
                        }')

  # Publish the message using curl
  curl -u "$USERNAME:$PASSWORD" \
       -H "Content-Type: application/json" \
       -X POST "$RABBITMQ_URL" \
       -d "$curl_payload"

    echo "Published message with routing key: $routing_key with message_id: $message_id from file: $json_file"
  done
}

# Check if input is a file or directory
if [[ -f "$INPUT_PATH" ]]; then
  # If it's a file, process it directly
  process_json_file "$INPUT_PATH"
elif [[ -d "$INPUT_PATH" ]]; then
  # If it's a directory, recursively find and process all JSON files
  find "$INPUT_PATH" -type f -name "*.json" | while read -r json_file; do
    process_json_file "$json_file"
  done
else
  echo "Error: $INPUT_PATH is not a valid file or directory."
  exit 1
fi
