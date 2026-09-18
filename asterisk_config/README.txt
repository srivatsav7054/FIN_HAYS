; =====================================================================
; SH-105 Asterisk PBX Configuration
; =====================================================================
; This directory contains the Asterisk configuration files needed
; to route phone calls from softphones (Linphone, Zoiper) to
; the SH-105 AI backend via AudioSocket.
;
; SETUP:
; 1. Install Asterisk 18+ (with AudioSocket module):
;      sudo apt install asterisk
;    On Windows, use WSL2 or Docker.
;
; 2. Copy these files to /etc/asterisk/ (or the Asterisk config dir):
;      cp pjsip.conf /etc/asterisk/pjsip.conf
;      cp extensions.conf /etc/asterisk/extensions.conf
;
; 3. Reload Asterisk:
;      asterisk -rx "core reload"
;
; 4. Register your softphone (Linphone/Zoiper) with:
;      Server: <your laptop IP>
;      Username: 1001
;      Password: sh105pass
;
; 5. Dial extension 3532 to connect to the AI agent.
; =====================================================================
