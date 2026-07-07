#!/usr/bin/env python3
import argparse
import os
import subprocess
import sys


def build_applescript(phone_number: str, message: str) -> str:
    phone = phone_number.replace('"', '\\"')
    text = message.replace('"', '\\"').replace('\n', '\\n')
    return f'''
tell application "Messages"
  activate
  try
    set targetService to first service whose service type = SMS
    set targetBuddy to buddy "{phone}" of targetService
    send "{text}" to targetBuddy
    return "sent_via_sms"
  on error errMsg
    error "SMS send failed: " & errMsg
  end try
end tell
'''.strip()

def main():
    parser = argparse.ArgumentParser(description="Send SMS via macOS Messages")
    parser.add_argument("--phone", required=True)
    parser.add_argument("--message", required=True)
    parser.add_argument("--api-key", default=None)
    args = parser.parse_args()

    stored_key = os.getenv("AUTOSCRIPT_API_KEY", "").strip()
    provided_key = (args.api_key or "").strip()

    if stored_key and provided_key != stored_key:
        print("ERROR: invalid API key", file=sys.stderr)
        return 2

    if not sys.platform.startswith("darwin"):
        print("ERROR: must run on macOS", file=sys.stderr)
        return 3

    applescript = build_applescript(args.phone, args.message)
    result = subprocess.run(["osascript", "-e", applescript],
                            capture_output=True, text=True)

    if result.returncode != 0:
        print("ERROR:", result.stderr.strip() or result.stdout.strip(), file=sys.stderr)
        return result.returncode

    print("SMS send command completed")
    return 0

if __name__ == "__main__":
    sys.exit(main())



    