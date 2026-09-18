# Asterisk Setup & Test Guide

Follow these exact steps to run Asterisk via Docker on this machine, register a softphone, and connect to the SH-105 backend.

## 1. Prerequisites
- **Docker**: Ensure Docker Desktop (or Docker Engine) is running on your laptop.
- **Linphone** (or Zoiper): A free SIP softphone client installed on your laptop or smartphone.
- **FastAPI Backend**: Ensure the SH-105 backend is running natively on your laptop (`uvicorn app.main:app --host 0.0.0.0 --port 8000`).

## 2. Run Asterisk via Docker

We will use the official Asterisk Docker image. It needs to mount the configuration files from this directory and expose SIP (5060) and RTP (10000-10099) ports. Crucially, it needs to be able to reach your AudioSocket server running on the host machine.

Open a terminal in the project root (`d:\SH2k26\HAYS`) and run this exact command:

```powershell
docker run -d --name sh105-asterisk `
  --net=host `
  -v ${PWD}/asterisk_config/pjsip.conf:/etc/asterisk/pjsip.conf:ro `
  -v ${PWD}/asterisk_config/extensions.conf:/etc/asterisk/extensions.conf:ro `
  andrius/asterisk:alpine
```

*(Note: We use `--net=host` so the Asterisk container shares your laptop's network interface. This makes it trivial for Asterisk to reach the AudioSocket server on `127.0.0.1:9092` and for your softphone to reach Asterisk on `5060` without complex port-forwarding issues).*

Check that Asterisk is running:
```powershell
docker logs sh105-asterisk
```
*(You should see Asterisk Ready messages).*

## 3. Register your Softphone (Linphone)

Open Linphone on your laptop or phone (must be on the same WiFi network). Add a new SIP account:

- **Username / SIP ID**: `1001`
- **Password**: `sh105pass`
- **Domain / Proxy / Server**: `127.0.0.1` (if Linphone is on the same laptop) or your laptop's LAN IP (e.g. `192.168.1.X`) if Linphone is on your mobile phone.
- **Transport**: `UDP`

Once registered, Linphone should show a green status (Registered).

## 4. Test the Connection

1. Ensure the SH-105 FastAPI backend is running. You should see both `Uvicorn running on port 8000` and `AudioSocket server listening on port 9092`.
2. In Linphone, dial **`3532`**.
3. You should hear a short "beep". Then, speak your question (e.g., in Hindi). 
4. The backend terminal should show `AudioSocket: new connection`, print the transcription, run the LLM, and synthesize the voice.
5. You should hear the response spoken back to you in your softphone!
