# Kitty Heartbeat Checklist

Run these checks each heartbeat (every 30 minutes):

1. Check ~/kitty-data/logs/ for any ERROR entries since last heartbeat
2. Check if any cron jobs failed
3. Check if gateway is healthy
4. Check if Ollama is responsive (ollama ps)
5. Check SQLite databases are not corrupted
6. If any urgent lead responses came in, alert on Telegram
7. If nothing needs attention: HEARTBEAT_OK
