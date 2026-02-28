# TALENTALIGN AI - Resume & Job Matching Engine

Production-grade SaaS project for semantic resume screening against job descriptions using FastAPI + React.

## 1) Tech Stack

Frontend:
- React + TypeScript + Vite
- TailwindCSS
- Framer Motion
- GSAP
- Recharts
- Lucide Icons
- Axios

Backend:
- Python 3.10+
- FastAPI + Uvicorn
- Pandas + NumPy
- SentenceTransformers
- scikit-learn
- PyMuPDF
- python-multipart
- Pydantic
- JWT auth
- SQLite + SQLAlchemy
- CORS

## 2) Architecture

```text
talentalign-ai/
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   |-- components/
|   |   |-- lib/
|   |   `-- hooks/
|-- backend/
|   |-- app/
|   |   |-- routes/
|   |   `-- services/
|   `-- requirements.txt
`-- docker-compose.yml
```

Backend flow:
1. User authenticates via `/auth/register` or `/auth/login`.
2. JWT token is stored client-side and sent as Bearer token.
3. `/match/analyze` accepts resume PDF and JD text/PDF.
4. Text extraction via PyMuPDF + cleaning.
5. SentenceTransformer (`all-MiniLM-L6-v2`) embeds resume and JD.
6. Cosine similarity -> overall score.
7. Skills and keyword density are computed.
8. Insights + heatmap and top sections are returned.

## 3) API Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /match/analyze`

Sample analyze response:

```json
{
  "score": 78.4,
  "overlapping_skills": ["python", "react"],
  "missing_skills": ["aws"],
  "strengths": ["..."],
  "suggestions": ["..."],
  "keyword_density": [{"keyword": "python", "resume_density": 0.2, "jd_density": 0.4, "gap": 0.2}],
  "heatmap_data": [{"resume_index": 0, "jd_index": 0, "value": 82.3}],
  "top_matching_sections": [{"resume_index": 1, "jd_index": 2, "value": 90.1}]
}
```

## 4) Local Setup (Manual)

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URL: `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## 5) Docker Setup

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## 6) How Embeddings Work

- Both documents are transformed to dense vectors using `SentenceTransformer`.
- Cosine similarity between vectors gives semantic alignment (0 to 1).
- Score percentage = `similarity * 100`.
- Section-level vectors produce heatmap intensity by sentence-pair similarity.

## 7) Frontend UX Highlights

- GSAP stagger intro animation on landing hero.
- Framer Motion for hover, tap, reveal, and route transitions.
- Glassmorphism cards and animated gradient background.
- Light/Dark toggle with persisted theme.
- Dashboard tab system for input/history snapshot.
- Recharts score and keyword density visualization.

## 8) Resume Bullet Points

- Built a production-style AI recruiter SaaS app using FastAPI, SentenceTransformers, and React TypeScript.
- Implemented JWT auth with secure password hashing and protected SPA routes.
- Engineered resume/JD semantic matching and skill-gap analytics with cosine similarity and keyword density.
- Designed a premium animated dashboard using GSAP, Framer Motion, Tailwind, and Recharts.
- Containerized full-stack deployment with Docker Compose for reproducible local environments.
