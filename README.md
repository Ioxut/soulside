# SoulSide 

**Platformă AI de sănătate mentală** — chat conversațional cu RAG, tracker emoțional, jurnal zilnic, resurse curate și conectare cu specialiști.

> FastAPI · Next.js 16 · PostgreSQL/pgvector · Groq · Deployat pe Railway + Vercel

---

## Funcționalități

- **Chat AI** — răspunsuri în streaming (SSE) ancorate într-o bază de cunoștințe administrată via RAG (pgvector + HuggingFace embeddings + Groq)
- **Jurnal emoțional** — înregistrare zilnică a stării cu heatmap calendar, grafic de trend și insight AI generat săptămânal
- **Resurse** — articole, video-uri, PDF-uri și ghiduri cu favorite și căutare
- **Specialiști** — director de specialiști cu flux de programare
- **Urgență** — pagină de resurse de criză imediată (`/urgenta`)
- **Panou admin** — ingestie PDF-uri în baza de cunoștințe, management utilizatori
- **Autentificare** — verificare OTP prin email, recuperare parolă, JWT în cookie-uri httpOnly (access 15 min + refresh 7 zile), token versioning, blocare la brute-force

---

## Stack tehnologic

| Strat | Tehnologie |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, Recharts, Framer Motion |
| **Backend** | FastAPI 0.115, SQLAlchemy 2.0, Alembic, slowapi (rate limiting) |
| **Bază de date** | PostgreSQL 16 + pgvector |
| **AI / RAG** | Groq API, LangChain, HuggingFace `sentence-transformers` |
| **Email** | Resend |
| **Deployment** | Railway (backend), Vercel (frontend), Neon (bază de date) |

---

## Pornire locală

### Cerințe

- Docker (pentru PostgreSQL)
- Python 3.11+
- Node.js 20+

### 1. Pornește baza de date

```bash
docker-compose up -d
```

Pornește PostgreSQL 16 cu pgvector pe portul `5433`.

### 2. Backend

```bash
cd backend

python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Completează cheile tale (vezi secțiunea Variabile de mediu)

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API disponibil la `http://localhost:8000` · Documentație Swagger la `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend

cp .env.example .env.local
# Setează NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
```

Aplicația disponibilă la `http://localhost:3000`

---

## Variabile de mediu

### `backend/.env`

```env
DATABASE_URL=postgresql://soulside:soulside@localhost:5433/soulside
JWT_SECRET_KEY=inlocuieste-cu-un-sir-random-de-minim-32-caractere
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=SoulSide <noreply@domeniultau.com>
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

> În producție (`ENVIRONMENT=production`), aplicația validează la startup că `JWT_SECRET_KEY` are minim 32 de caractere și că toate cheile API sunt prezente. Valorile lipsă sau slabe opresc intenționat procesul.

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Structura proiectului

```
soulside/
├── backend/
│   ├── app/
│   │   ├── models/         # Modele SQLAlchemy
│   │   ├── routers/        # auth, chat, mood, content, specialists, rag, admin, notifications
│   │   ├── schemas/        # Scheme Pydantic v2
│   │   ├── services/       # ai.py, rag.py, embeddings.py, ingestion.py, email.py
│   │   ├── utils/          # security.py (JWT + bcrypt)
│   │   ├── config.py       # Setări cu validare pentru producție
│   │   ├── database.py     # Engine SQLAlchemy + sesiune
│   │   ├── deps.py         # Dependențe auth (verificare versiune token)
│   │   ├── limiter.py      # Rate limiter slowapi
│   │   └── main.py         # CORS, security headers, health check
│   ├── alembic/            # Migrări bază de date
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── (auth)/         # login, register, verify-otp, forgot-password, reset-password
│   │   ├── (app)/          # dashboard, chat, chat-history, mood, resources,
│   │   │                   # specialists, urgenta, settings, profile, about, admin
│   │   ├── page.tsx        # Landing page
│   │   └── globals.css     # Design system (variabile CSS, glassmorphism, animații)
│   ├── components/
│   │   ├── ui/             # OfflineIndicator, SpaceBackground
│   │   └── layout/         # Sidebar, AuthGuard
│   ├── lib/
│   │   ├── api.ts          # Axios + interceptor refresh
│   │   └── utils.ts
│   ├── store/              # Zustand auth store
│   ├── types/              # Interfețe TypeScript
│   └── next.config.ts
└── docker-compose.yml      # PostgreSQL 16 + pgvector (dev local)
```

---

## Securitate

| Măsură | Detalii |
|---|---|
| Cookie-uri | `httpOnly`, `SameSite=Lax`, `Secure` în producție |
| Token versioning | Logout / schimbare parolă invalidează toate sesiunile active |
| Protecție brute-force | Blocare cont după 5 încercări eșuate (15 min), rate limiting per IP |
| OTP | Cod 6 cifre, expiră în 10 min, max 3 încercări / 10 min |
| Resetare parolă | Token single-use, expiră în 15 min |
| Upload PDF | Validare extensie + MIME type + magic bytes (`%PDF-`), limită 50 MB |
| Dimensiune request | Limită globală 10 MB per request |
| Security headers | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, HSTS (producție) |
| CORS | Origin specific, metode și headere restricționate |
| Parole | bcrypt, 8–128 caractere |
| SQL injection | SQLAlchemy ORM — query-uri parametrizate |

---

## Note primă configurare

- **Primul utilizator** înregistrat devine automat admin
- Ca admin, accesează `/admin` pentru a uploada PDF-uri în baza de cunoștințe — AI-ul le folosește drept context
- Fără documente uploadate, AI-ul răspunde în continuare, dar fără cunoștințe specifice domeniului
