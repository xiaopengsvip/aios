#!/usr/bin/env python3
"""
Hermes IPC - Bidirectional communication between local and server Hermes.

Usage:
    python hermes_ipc.py send "message"   # Send to server
    python hermes_ipc.py check            # Check for new messages
    python hermes_ipc.py read             # Read all messages
    python hermes_ipc.py listen           # Listen for messages
"""

import json
import sys
import time
import paramiko
from datetime import datetime

SSH_HOST = "43.167.213.143"
SSH_USER = "ubuntu"
SSH_PASS = "Everett@10a"

INBOX_LOCAL = "/tmp/hermes-ipc/inbox-local.json"
INBOX_SERVER = "/tmp/hermes-ipc/inbox-server.json"

def get_ssh():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=10)
    return ssh

def remote_json_op(ssh, path, operation, data=None):
    """Read or write JSON on remote server using python to avoid shell escaping issues."""
    if operation == "read":
        script = f'''python3 -c "import json; print(json.dumps(json.load(open('{path}'))))"'''
        stdin, stdout, stderr = ssh.exec_command(script, timeout=10)
        result = stdout.read().decode().strip()
        return json.loads(result) if result else {"messages": []}
    
    elif operation == "write" and data is not None:
        json_str = json.dumps(data, ensure_ascii=False)
        # Write via python to handle escaping properly
        script = f'''python3 -c "
import json
data = json.loads('{json_str.replace(chr(39), chr(39)+chr(92)+chr(39)+chr(39))}')
with open('{path}', 'w') as f:
    json.dump(data, f, ensure_ascii=False)
"'''
        ssh.exec_command(script, timeout=10)

def send_message(text, priority="normal"):
    ssh = get_ssh()
    data = remote_json_op(ssh, INBOX_LOCAL, "read")
    
    data["messages"].append({
        "id": int(time.time() * 1000),
        "from": "local",
        "text": text,
        "priority": priority,
        "timestamp": datetime.now().isoformat(),
        "read": False
    })
    
    remote_json_op(ssh, INBOX_LOCAL, "write", data)
    ssh.close()
    print(f"Sent: {text[:60]}...")

def read_messages(unread_only=True):
    ssh = get_ssh()
    data = remote_json_op(ssh, INBOX_SERVER, "read")
    ssh.close()
    
    messages = data.get("messages", [])
    if unread_only:
        messages = [m for m in messages if not m.get("read", False)]
    return messages

def mark_read(message_ids):
    ssh = get_ssh()
    data = remote_json_op(ssh, INBOX_SERVER, "read")
    for msg in data.get("messages", []):
        if msg.get("id") in message_ids:
            msg["read"] = True
    remote_json_op(ssh, INBOX_SERVER, "write", data)
    ssh.close()

def check():
    messages = read_messages(unread_only=True)
    if messages:
        print(f"{len(messages)} new message(s):")
        for msg in messages:
            print(f"  [{msg.get('timestamp', '?')}] {msg.get('text', '')}")
        mark_read([m.get("id") for m in messages])
    else:
        print("No new messages.")
    return messages

def listen(poll_interval=5):
    print(f"Listening for messages (poll every {poll_interval}s)... Ctrl+C to stop")
    seen_ids = set()
    try:
        while True:
            messages = read_messages(unread_only=True)
            for msg in messages:
                mid = msg.get("id")
                if mid not in seen_ids:
                    seen_ids.add(mid)
                    print(f"\n[{msg.get('timestamp', '?')}] {msg.get('text', '')}")
                    mark_read([mid])
            time.sleep(poll_interval)
    except KeyboardInterrupt:
        print("\nStopped.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    cmd = sys.argv[1]
    if cmd == "send" and len(sys.argv) > 2:
        send_message(" ".join(sys.argv[2:]))
    elif cmd == "read":
        for msg in read_messages(unread_only=False):
            s = "read" if msg.get("read") else "NEW"
            print(f"[{s}] {msg.get('from', '?')}: {msg.get('text', '')}")
    elif cmd == "check":
        check()
    elif cmd == "listen":
        listen()
    else:
        print(__doc__)
