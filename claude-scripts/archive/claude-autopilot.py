#!/usr/bin/env python3
"""
Claude Code Auto-Pilot
Automatically responds to Claude Code prompts with option 1 (proceed)
"""

import subprocess
import sys
import time
import signal
import os
from threading import Thread

class ClaudeAutoPilot:
    def __init__(self):
        self.process = None
        self.running = True
        
    def signal_handler(self, signum, frame):
        print("\n🛑 Stopping Claude Auto-Pilot...")
        self.running = False
        if self.process:
            self.process.terminate()
        sys.exit(0)
    
    def auto_respond(self):
        """Automatically respond to prompts"""
        while self.running:
            try:
                if self.process and self.process.poll() is None:
                    # Send "1" followed by enter every 2 seconds
                    self.process.stdin.write("1\n")
                    self.process.stdin.flush()
                time.sleep(2)
            except:
                break
    
    def start_claude(self):
        """Start Claude Code with auto-responses"""
        print("🚀 Starting Claude Code Auto-Pilot...")
        print("📝 Will automatically choose option 1 for all prompts")
        print("⏹️  Press Ctrl+C to stop")
        
        # Setup signal handler
        signal.signal(signal.SIGINT, self.signal_handler)
        
        try:
            # Start Claude Code process
            self.process = subprocess.Popen(
                ['claude', 'code'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=0
            )
            
            # Start auto-responder thread
            responder_thread = Thread(target=self.auto_respond)
            responder_thread.daemon = True
            responder_thread.start()
            
            # Monitor output
            while self.running and self.process.poll() is None:
                output = self.process.stdout.readline()
                if output:
                    print(output.strip())
                    
                    # Look for common prompts and respond
                    if any(prompt in output.lower() for prompt in [
                        "do you want to proceed",
                        "continue?",
                        "press 1",
                        "1)",
                        "choose an option"
                    ]):
                        print("🤖 Auto-responding with option 1...")
                        self.process.stdin.write("1\n")
                        self.process.stdin.flush()
                
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            if self.process:
                self.process.terminate()

if __name__ == "__main__":
    autopilot = ClaudeAutoPilot()
    autopilot.start_claude()