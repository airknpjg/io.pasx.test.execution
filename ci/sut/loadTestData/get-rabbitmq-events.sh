#!/bin/bash
####################################################################################################
# This is an utility tool to be used for development and debugging purposes.
# This script is used to retrieve messages from a RabbitMQ queue and save them to a file.
# The script requires the queue name as the first argument and an optional output file name as the second argument.
# If no output file name is provided, the script will generate an auto-incremented filename.
####################################################################################################

# RabbitMQ server details
RABBITMQ_URL="http://localhost:15672/rabbitmq/api/queues/%2F"
USERNAME="pasx"
PASSWORD="pasx"

# Input parameters
QUEUE_NAME="$1"
OUTPUT_FILE="$2"

# Check if queue name is provided
if [[ -z "$QUEUE_NAME" ]]; then
  echo "Usage: $0 <queue_name> [output_file]"
  exit 1
fi

# Function to generate an auto-incremented filename if no output file is specified
generate_output_filename() {
  local base_name="events"
  local extension=".json"
  local counter=1

  while [[ -e "${base_name}$(printf "%03d" "$counter")$extension" ]]; do
    counter=$((counter + 1))
  done

  echo "${base_name}$(printf "%03d" "$counter")$extension"
}

# Generate output file name if not provided
if [[ -z "$OUTPUT_FILE" ]]; then
  OUTPUT_FILE=$(generate_output_filename)
fi

echo "Saving messages to: $OUTPUT_FILE"

# Peek all messages from the specified RabbitMQ queue
curl -u "$USERNAME:$PASSWORD" \
     -H "Content-Type: application/json" \
     -X POST "${RABBITMQ_URL}/${QUEUE_NAME}/get" \
     -d '{"count":1000,"ackmode":"ack_requeue_true","encoding":"auto","truncate":50000}' \
     -o "$OUTPUT_FILE"

# Verify if the curl command was successful
if [[ $? -eq 0 ]]; then
  echo "Messages successfully saved to $OUTPUT_FILE"
else
  echo "Failed to retrieve messages from the queue."
  exit 1
fi
