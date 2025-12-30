#!/bin/bash
set -e

# Infisical Project Duplication Script
# Usage: ./scripts/duplicate_infisical_project.sh <source_project_id> <destination_project_id>

SOURCE_PROJECT_ID=$1
DEST_PROJECT_ID=$2

if [ -z "$SOURCE_PROJECT_ID" ] || [ -z "$DEST_PROJECT_ID" ]; then
  echo "Usage: $0 <source_project_id> <destination_project_id>"
  echo "Error: Both Source and Destination Project IDs are required."
  exit 1
fi

if ! command -v infisical &> /dev/null; then
  echo "Error: infisical CLI is not installed."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Error: jq is not installed."
  exit 1
fi

echo "Starting duplication from Project ID: $SOURCE_PROJECT_ID to $DEST_PROJECT_ID"

ENVIRONMENTS=("dev" "staging" "prod")

for ENV in "${ENVIRONMENTS[@]}"; do
  echo "---------------------------------------------------"
  echo "Processing environment: $ENV"
  
  # Export secrets from source project
  echo "Exporting secrets from source project ($ENV)..."
  EXORT_FILE="secrets_${ENV}.json"
  
  # Fetch secrets in JSON format
  if ! infisical export --projectId "$SOURCE_PROJECT_ID" --env "$ENV" --format json > "$EXORT_FILE"; then
    echo "Warning: Failed to export secrets for environment '$ENV' or no secrets found. Skipping."
    rm -f "$EXORT_FILE"
    continue
  fi

  # Check if file is empty or valid JSON
  if [ ! -s "$EXORT_FILE" ]; then
     echo "No secrets found for $ENV (file empty). Skipping."
     rm -f "$EXORT_FILE"
     continue
  fi

  # Iterate through keys and values using jq and import to destination
  # Note: 'infisical secrets set' takes key=value arguments.
  # We need to be careful with quoting.
  
  echo "Importing secrets to destination project ($ENV)..."
  
  # Read JSON and loop through keys
  # Assuming export format is like [{"key": "KEY", "value": "VALUE", ...}, ...] or {"KEY": "VALUE"}
  # 'infisical export --format json' usually outputs:
  # [ { "key": "DB_URL", "value": "...", ... }, ... ]
  
  # We construct a command to set all secrets at once if possible, or one by one.
  # 'infisical secrets set' can take multiple key=value pairs.
  
  # Get all keys first
  KEYS=$(jq -r '.[].key' "$EXORT_FILE")
  
  # Loop through keys
  # We use a file descriptor or mapfile to avoid pipe subshell issues if needed, strictly speaking
  # but simple for loop over string is fine if keys don't have spaces (env vars usually don't).
  
  for KEY in $KEYS; do
      # Extract value to a temp file to handle multi-line and special characters safely
      VAL_FILE=$(mktemp)
      jq -j --arg k "$KEY" '.[] | select(.key==$k) | .value' "$EXORT_FILE" > "$VAL_FILE"
      
      echo "Setting secret: $KEY"
      # Use @ syntax to read from file
      infisical secrets set "$KEY=@$VAL_FILE" --projectId "$DEST_PROJECT_ID" --env "$ENV" --silent
      
      rm -f "$VAL_FILE"
  done

  # Clean up
  rm -f "$EXORT_FILE"
  echo "Completed environment: $ENV"
done

echo "---------------------------------------------------"
echo "Duplication complete!"
