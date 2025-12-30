#!/usr/bin/env python3
import json
import os
import sys

def main():
    # Configuration
    infisical_path = ".infisical.json"
    old_id = "e3871e85-7a12-4fff-9f5a-5cefd3593a5a"
    
    # Check if .infisical.json exists
    if not os.path.exists(infisical_path):
        print(f"Error: {infisical_path} not found in current directory.")
        sys.exit(1)

    # Read new ID from .infisical.json
    try:
        with open(infisical_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            new_id = data.get("workspaceId")
            if not new_id:
                print(f"Error: 'workspaceId' not found in {infisical_path}")
                sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Failed to parse {infisical_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading {infisical_path}: {e}")
        sys.exit(1)

    print(f"Old Project ID: {old_id}")
    print(f"New Project ID: {new_id}")
    print("-" * 50)

    # 1. Scan for matches
    print("Scanning for matches...")
    exclude_dirs = {'.git', 'node_modules', '.next', 'dist', 'build', '.infisical.json', '.venv', 'venv'} 
    matches = [] # List of {'file': path, 'count': int}

    root_dir = "."
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            
            if os.path.abspath(file_path) == os.path.abspath(__file__): continue
            if os.path.abspath(file_path) == os.path.abspath(infisical_path): continue

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    count = content.count(old_id)
                    if count > 0:
                        matches.append({'file': file_path, 'count': count, 'selected': True})
            except (UnicodeDecodeError, PermissionError):
                continue

    if not matches:
        print("No matches found.")
        sys.exit(0)

    # 2. Checklist UI
    while True:
        print("\nTarget Files:")
        for i, match in enumerate(matches):
            status = "[x]" if match['selected'] else "[ ]"
            print(f"{status} {i+1}. {match['file']} ({match['count']} matches)")
        
        print("\nOptions:")
        print("  <number> : Toggle selection")
        print("  a        : Select All")
        print("  n        : Select None")
        print("  ENTER    : Execute Replacement")
        print("  q        : Quit")
        
        choice = input("Select > ").strip().lower()
        
        if choice == '':
            break
        elif choice == 'q':
            print("Aborted.")
            sys.exit(0)
        elif choice == 'a':
            for match in matches: match['selected'] = True
        elif choice == 'n':
            for match in matches: match['selected'] = False
        elif choice.isdigit():
            idx = int(choice) - 1
            if 0 <= idx < len(matches):
                matches[idx]['selected'] = not matches[idx]['selected']
            else:
                print("Invalid number.")
        else:
            print("Invalid input.")

    # 3. Execute Replacement
    selected_matches = [m for m in matches if m['selected']]
    if not selected_matches:
        print("No files selected. Exiting.")
        sys.exit(0)

    print("\nProcessing...")
    for match in selected_matches:
        file_path = match['file']
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content.replace(old_id, new_id)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {file_path}")
        except Exception as e:
            print(f"Error updating {file_path}: {e}")

    print("Done.")

if __name__ == "__main__":
    main()
