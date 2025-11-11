## DP TryHackMe-like Platform (Backend + VPN + Machines)

This repository contains a backend that lets users:
- Log in and download a per-user OpenVPN profile
- Start per-user Docker machines and get an internal IP
- Access machines over the VPN
- Submit flags and see progress and leaderboards
- Admins can create/update/delete labs (rooms) tied to Docker images

Never changes your existing visual design; all functionality is under `/api`.

## Quick Start (Local)

Prereqs:
- Node.js v18+
- Docker installed and running
- SQLite3 (optional)
- OpenVPN server (for VPN flows)

1) Install
```
cd dataprotect-backend
npm install
```

2) Configure
Copy `.env.example` to `.env` and adjust values.

3) Initialize DB
```
npm run init-db
```

4) Create Docker lab network
```
docker network create --subnet 172.18.0.0/16 dp_lab_net
```

5) Start backend
```
npm start
```

6) Health check
```
curl http://localhost:5000/health
```

7) Login (seeded admin)
```
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

8) Build sample lab image
```
cd sample-labs/web-basic
docker build -t dp/lab-web-basic:latest .
```

9) Create a lab (admin)
```
curl -X POST http://localhost:5000/api/admin/labs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
        "title":"Intro Web Enumeration",
        "slug":"intro-web-enum",
        "difficulty":"easy",
        "points":10,
        "dockerImage":"dp/lab-web-basic:latest",
        "instructions":"Enumerate the service and find robots.txt to get the flag.",
        "hints":["Check /robots.txt","Try common directories"],
        "flagPlain":"THM{intro_web_enum_flag}"
      }'
```

10) Download VPN profile (user)
```
curl -o myuser.ovpn http://localhost:5000/api/vpn/profile \
  -H "Authorization: Bearer <USER_JWT_TOKEN>"
```
Import `.ovpn` into the OpenVPN client and connect.

11) Start machine (user)
```
curl -X POST http://localhost:5000/api/machines/<labId>/start \
  -H "Authorization: Bearer <USER_JWT_TOKEN>"
```
Response includes `"ip": "172.18.0.x"`. With VPN connected, browse to the IP (e.g. `http://172.18.0.5:8080`).

12) Submit flag
```
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_JWT_TOKEN>" \
  -d '{"challengeId":"<labId>","flag":"THM{intro_web_enum_flag}"}'
```

13) Leaderboard
```
curl http://localhost:5000/api/leaderboard
```

## VPN Server (One-time setup)
- Push route to the Docker subnet:
  ```
  push "route 172.18.0.0 255.255.0.0"
  ```
- Enable forwarding and iptables/NAT between VPN subnet (e.g., 10.8.0.0/24) and Docker subnet (172.18.0.0/16).

See `dataprotect-backend/scripts/openvpn` for example server and client configs.

## Production Notes
- Change admin password immediately
- Use strong JWT_SECRET
- Restrict CORS
- Run behind HTTPS (Nginx + Let’s Encrypt)
- Consider DB backups and Docker resource limits
