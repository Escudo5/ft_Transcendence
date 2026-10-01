*This project has been created as part of the 42 curriculum by nmagro-r, pablalva, smarquez, ksudyn, osmunoz-.*

# 🎴 42 Card Album — ft_transcendence

A collectible card trading platform featuring real-time public data from 42 Madrid students. Each student is represented as a unique collectible card, with custom rarities dynamically generated from their cursus level, achievements, and staff status. 

---

## 1. Description

**42 Card Album** transforms public intra student statistics into a gamified, interactive card-collecting experience. Users can open 3D card packs, build their collection, trade duplicate cards with peers, complete contract upgrades, track global leaderboards, and manage their profile in multiple languages.

> ℹ️ **Note for Evaluators:** This project is a **gamified collectible platform**, not a traditional arcade game (such as Pong). Points are earned through card rarities, pack openings, daily login rewards, and trading strategies.

### Key Features Summary
- **824 Unique Cards:** Dynamically generated from real 42 Madrid student intra data.
- **3D Pack Opening:** Interactive 3D card pack opening experiences powered by Three.js.
- **Card Trading & Contracts:** Trade duplicates with friends or execute 4:1 rarity contract upgrades.
- **Social & Private Chat:** Friend requests, real-time online status tracking, and private messaging with blocking features.
- **Global Leaderboard:** Point-based ranking calculated from total collection value.
- **Multi-language & RTL:** Full support for Spanish, English, and Arabic (with mirrored RTL layouts).
- **Public API:** Key-protected REST API with rate limiting and automated documentation.
- **PWA & Offline Capability:** Installable as a Progressive Web App with offline service worker caching.
- **GDPR Compliance:** Complete user data export in JSON, CSV, and HTML formats, email notifications, and irreversible account/avatar deletion.

---

## 2. Instructions

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose (v2+)
- [Git](https://git-scm.com/)
- Ports `3000`, `4173`, `8000`, and `5432` free on your machine.

### Environment Setup (`.env`)
Before starting the application, copy the environment template and provide your 42 Intra API credentials:

```bash
cp .env.example .env
```

Set the following variables inside `.env` (the template marks the ones you must fill in with `RELLENAR`, Spanish for "fill in"):
- `CLIENT_ID_NACHO` and `CLIENT_SECRET_NACHO`: credentials of the 42 application used for the **web login**. Obtained from `profile.intra.42.fr` -> **Settings** -> **API** -> your application.
- `CLIENT_ID_PABLO` and `CLIENT_SECRET_PABLO`: credentials of the 42 application used by the **card sync scripts** (`make start`, `make sync-quick`, `make sync-full`). Without them the application starts, but no cards are loaded.
- `FORTYTWO_REDIRECT_URI`: already set to `https://localhost:3000` in the template. It must match **letter by letter** the address you open in the browser and the redirect URI registered in your 42 application, with no path and no trailing slash.
- `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` (optional): a Gmail account with an app password, used to send the GDPR confirmation emails. If they are left empty, everything still works; the emails are simply not sent.

### Quick Start
To build, start all containers, and sync a first batch of cards (the first 100 students of the campus list plus the team members):

```bash
make start
```

Then open your browser and navigate to:
👉 **[https://localhost:3000](https://localhost:3000)**

### Makefile Commands Reference

| Command | Description |
| :--- | :--- |
| `make start` | Builds containers, starts services, and runs quick test card sync. |
| `make up` | Starts all containers in the foreground, showing their logs (Ctrl+C stops them). |
| `make up_silent` | Starts all containers in the background. |
| `make down` | Stops and removes the containers. The database is kept. |
| `make logs` | Displays live logs for all services (or `make logs SERVICE=backend`). |
| `make migrate` | Executes Django database migrations. |
| `make superuser` | Creates an administrative user for the Django Admin panel. |
| `make sync-quick` | Syncs the first page of the campus list (100 students, some of them skipped by the filters) plus the 5 team members' cards. |
| `make sync-full` | **Full campus sync:** requests the profile of every student that passes the filters, pausing between requests to respect the 42 API rate limit, so it takes several minutes. |
| `make pwa` | Builds and serves the PWA production build on `http://localhost:4173`. |

---

## 3. Team Information

| Login | Assigned Role | Primary Responsibilities |
| :--- | :--- | :--- |
| **`nmagro-r`** | Tech Lead · Backend | System architecture and technical decisions. OAuth 2.0 authentication, Public API, PWA integration, chat backend, and code review/merge management. |
| **`pablalva`** | Product Owner (PO) · Backend · DevOps | Product vision and feature priorities. 42 API synchronization engine (module of choice). Core game logic: rarity algorithms, card economics, point system, trading contracts, friend systems, leaderboard rankings, GDPR compliance (data export & deletion), Docker Compose, and Makefile infrastructure. |
| **`smarquez`** | Frontend | Full internationalization (3 languages + RTL layout engine), interactive 3D card pack openings with Three.js, motion animations, and visual styling/color palette design. |
| **`ksudyn`** | Frontend | Card visual design, rarity neon effects, Creator tier cards, album/catalog view, pack store UI, pagination, filter controls, and private chat UI enhancements. |
| **`osmunoz-`** | Project Manager (PM) · Documentation | Facilitated team coordination, removed technical obstacles, aligned UI requirements with DB schemas, and authored the project README. |
---

## 4. Project Management

- **Git Branching Strategy:** Development followed a feature-branch workflow (`feature/name`, `lab/db/test` for integration, and `main` for stable releases). Direct pushes to `main` were restricted.
- **Integration Workflow:** All individual components were merged and validated into the common `lab/db/test` integration branch prior to final release.
- **Code Reviews & Quality Control:** Team members conducted peer code reviews before merging branches to prevent regressions and maintain code consistency.
- **Communication & Meetings:** Daily stand-up meetings on 42 Madrid campus paired with dedicated WhatsApp and Discord communication channels.

---

## 5. Technical Stack

### Frontend
- **React 18.3 + Vite 5.4:** Chosen to fulfill the web framework requirement while providing modular reusable UI components and fast Hot Module Replacement (HMR).
- **react-router-dom 6.22:** Enables smooth single-page application (SPA) client-side routing.
- **Three.js 0.185:** Used for rendering real-time 3D card pack opening experiences (Major 3D Graphics module).
- **framer-motion 12.43:** Smooth card hover effects, flip animations, and page transitions.

### Backend
- **Django 5.1.8 + Django REST Framework 3.15:** Provides a robust ORM, built-in admin panel, secure user authentication, RESTful API endpoints, and rate-limiting throttles.
- **Pillow 11.0:** Processes uploaded user avatars and strips sensitive EXIF metadata.

### Database
- **PostgreSQL 16:** Relational database selected due to complex relational data (users owning card instances, trading requests between users, friendship networks). Enforces foreign key constraints and `ON DELETE CASCADE` cascading deletes required for GDPR compliance.

### Infrastructure & Security
- **Docker Compose:** Manages three isolated services (`db`, `backend`, `frontend`) running seamlessly via a single command.
- **Nginx / HTTPS:** SSL/TLS certificate generated on startup to secure all web traffic.

---

## 6. Database Schema

The database architecture is built around 9 primary Django models:

| Table / Model | Key Fields | Relationships & Description |
| :--- | :--- | :--- |
| **`CustomUser`** | `id_42`, `email`, `is_alumni`, `estado`, `bio`, `nombre_mostrado`, `avatar`, `ultimo_regalo_diario` | Extends Django `AbstractUser`. Stores custom profile fields, online status, and daily reward timers. |
| **`Card`** | `login` (unique), `coalition`, `title`, `cursus_lvl`, `eval_point`, `photo`, `tier` | Central card catalog populated from 42 Intra API statistics. |
| **`UserCard`** | `cantidad`, `fecha_obtencion` | ForeignKeys: `user` -> `CustomUser`, `card` -> `Card`. Unique per user-card pair. Represents user album inventory. |
| **`UserPack`** | `tipo_sobre` (common/rare/epic), `cantidad` | ForeignKey: `user` -> `CustomUser`. Stores unopened pack inventory. |
| **`Intercambio`** | `estado`, `created_at`, `resuelto_en` | ForeignKeys: `de`/`para` -> `CustomUser`, `carta_ofrecida`/`carta_pedida` -> `Card`. Peer-to-peer card trades. |
| **`FriendRequest`** | `status`, `created_at` | ForeignKeys: `sender`/`receiver` -> `CustomUser`. Friend invitations and status tracking. |
| **`Bloqueo`** | `created_at` | ForeignKeys: `de`/`a` -> `CustomUser`. User block list for chat privacy. |
| **`Message`** | `texto`, `created_at`, `leido` | ForeignKeys: `sender`/`receiver` -> `CustomUser`. Direct private messages. |
| **`ClaveApi`** | `nombre`, `huella` (SHA-256), `prefijo`, `activa`, `ultimo_uso` | ForeignKey: `usuario` -> `CustomUser`. Stores hashed public API access keys. Plaintext keys are never stored. |

> 🛡️ **GDPR Integrity Note:** All user-related foreign keys use `on_delete=models.CASCADE`. When a user deletes their account, all associated cards, trades, messages, and API keys are automatically wiped from the database.

---

## 7. Features List

1. **42 OAuth 2.0 Login (`nmagro-r`):** Single Sign-On with 42 Intra credentials without storing external passwords.
2. **Email & Password Authentication (`nmagro-r`):** Secondary login mechanism with salted & hashed passwords.
3. **42 Campus Synchronization Engine (`pablalva`, `nmagro-r`):** Synchronizes entire campus directory into collectible cards.
4. **Dynamic Rarity & Point System (`pablalva`):** Calculates rarities (Junior, Senior, Transcender, Legendary, Staff) from level and achievements.
5. **Card Album & Search Catalog (`ksudyn`, `smarquez`):** Real-time text search, rarity filters, date filters, 4 sorting modes, and pagination.
6. **Card Visuals & Neon Aesthetics (`ksudyn`, `smarquez`):** Custom borders, neon glowing effects per tier, and Creator cards.
7. **3D Interactive Card Packs (`smarquez`):** Real-time 3D opening animations rendered with Three.js.
8. **Pack Store & Inventory (`ksudyn`):** Common, Rare, and Epic pack purchases containing 5 cards each.
9. **Contract Upgrades (`pablalva`, `nmagro-r`):** Burn 4 duplicate cards of the same rarity to receive 1 card of the next tier.
10. **Peer-to-Peer Trading (`pablalva`, `ksudyn`):** Propose, accept, or reject card trades with auto-expiration after 3 days.
11. **Friends System & Online Status (`pablalva`, `nmagro-r`):** Friend requests, friend lists, and real-time online indicator.
12. **Private Messaging (`ksudyn`, `nmagro-r`):** Direct chat with read receipts and user blocking capabilities.
13. **Global Leaderboard (`pablalva`):** Real-time ranking based on overall collection score.
14. **User Profile & Achievements (`ksudyn`):** Custom biography, display name, avatar upload, achievements, and 42 Intra links.
15. **Daily Gift System (`pablalva`):** Claim 1 free daily card pack every 24 hours.
16. **Internationalization & RTL (`smarquez`):** Spanish, English, and Arabic language switcher with full RTL layout mirroring.
17. **Public REST API (`nmagro-r`):** 9 key-protected endpoints with rate limiting, SHA-256 key hashing, and swagger-style documentation.
18. **Progressive Web App (`nmagro-r`):** Installable web application with offline service worker caching.
19. **GDPR Compliance (`pablalva`, `osmunoz-`):** Download user data in JSON, CSV, or HTML format, email delivery, and account deletion with disk file cleanup.
20. **Legal & Compliance Pages (`nmagro-r`):** Privacy Policy and Terms of Service translated in 3 languages.
21. **Container Infrastructure (`pablalva`):** Docker Compose orchestration, Makefile scripts, and HTTPS setup.

---

## 8. Modules & Point Breakdown

Total points built: **21 Points** (19 points maximum evaluation cap + 2 buffer points).  
*Required minimum: 14 points.*

### Major Modules (2 Points Each)

| Module | Contributor(s) | Implementation Details |
| :--- | :--- | :--- |
| **Web Frameworks** | All | Built using React 18 on the frontend and Django 5 + DRF on the backend. |
| **User Interaction** | `ksudyn`, `pablalva` | Implements private messaging, user profiles, and friend management. |
| **Standard User Management** | `pablalva`, `ksudyn` | Profile editing, avatar upload, friend online status, and public profile pages. |
| **Advanced 3D Graphics** | `smarquez` | Three.js rendering engine: perspective camera, PBR materials, image-based lighting (`RoomEnvironment`), and OrbitControls for 3D pack opening. |
| **Public API** | `nmagro-r` | 9 REST endpoints, API key authentication stored as SHA-256 hashes, HTTP 429 rate limiting, and auto-generated documentation. |
| **Module of Choice: 42 Sync Engine** | `pablalva` | Custom 993-line synchronization engine mapping 42 Intra API data into collectible cards. *(See detailed justification below)*. |

### Minor Modules (1 Point Each)

| Module | Contributor(s) | Implementation Details |
| :--- | :--- | :--- |
| **ORM** | `nmagro-r`, `pablalva` | Django ORM with 9 relational models. |
| **OAuth 2.0** | `nmagro-r` | Remote 42 Intra single sign-on authentication. |
| **Multiple Languages** | `smarquez` | Custom i18n system with React Context supporting 279 translation keys across Spanish, English, and Arabic. |
| **RTL Support** | `smarquez` | Full `dir="rtl"` document layout mirroring for Arabic language users. |
| **GDPR Compliance** | `pablalva`, `osmunoz-` | Multi-format data export (JSON, CSV, HTML), automated email delivery, confirmation dialogs, and complete avatar disk file deletion. |
| **Custom Design System** | `ksudyn`, `smarquez` | 12 custom reusable UI components, 140 CSS variables palette, and custom typography without third-party UI component libraries. |
| **Advanced Search** | `ksudyn` | Live search input, rarity filter, date filter, 4 sorting options, and pagination. |
| **Gamification** | `pablalva` | Global leaderboards, daily gift rewards, pack openings, and collection point scoring. |
| **PWA** | `nmagro-r` | Web app manifest and service worker with offline caching (`make pwa`). |

---

### 🌟 Module of Choice Justification: 42 API Synchronization Engine (2 Points)

The 42 API Synchronization Engine (`993 lines` across `fill_db.py`, `login_card.py`, `intra.py`, and `rarezas.py`) is claimed as a **Major Module of Choice**.

#### 1. Why we chose this module
Without this engine, the core product concept would not exist. A 42 student collectible card album requires authentic, live data from 42 students. Instead of mock data, this engine bridges an external REST API into a balanced game environment.

#### 2. Technical challenges addressed
- **Rate Limit Management:** 42 Intra API throttles excessive requests. The sync engine uses paginated fetching with exponential backoff and automatically handles `HTTP 429` responses.
- **Data Normalization (`intra.py`):** Student profiles retrieved from different 42 endpoints return varying JSON structures. `intra.py` normalizes disparate schemas into a single internal structure.
- **Dynamic Rarity Derivation (`rarezas.py`):** Converts raw student metrics (cursus level, grade, staff achievements) into 6 balanced tiers: 44 Legendary, 237 Transcender, 337 Senior, 197 Junior, 9 Staff, and 0 Creator cards across 824 campus cards.
- **Edge-Case Filtering:** Automatically filters out staff bots, service accounts, blackholed accounts, and zero-level piscine accounts.
- **Request Optimization:** Pre-loads coalition maps into memory to reduce API roundtrips by >80%.

#### 3. Value added to the project
It transforms raw external student statistics into an automated, self-balancing catalog of 824 playable collectible cards.

#### 4. Why it deserves Major Status (2 Points)
Comprising 993 lines of Python code across 4 modular services, it handles external API rate limits, schema normalization, complex business rules, and error recovery.

---

## 9. Individual Contributions & Challenges Faced

### `nmagro-r`
- **Contributions:** Architected backend REST APIs, OAuth 2.0 42 authentication, Public API with SHA-256 key hashing and rate limiting, and PWA integration.
- **Challenge Faced:** OAuth `redirect_uri` mismatches between browser and server resulted in silent login failures.
- **Resolution:** Standardized environment configuration in `.env` and documented exact host matching requirements.

### `pablalva`
- **Contributions:** Built the 42 API synchronization engine (module of choice). Developed card rarity algorithms, economy scoring, trading contracts, friend systems, leaderboard logic, GDPR data export/deletion endpoints, Docker Compose setup, and Makefile.
- **Challenge Faced:** Django's default `user.delete()` deleted database records but left uploaded avatar image files orphaned on the disk.
- **Resolution:** Implemented explicit disk file removal before calling database deletion hooks to satisfy strict GDPR privacy requirements.

### `smarquez`
- **Contributions:** Built Three.js 3D card pack opening engine, complete i18n translation system (279 keys in Spanish, English, Arabic), and full RTL layout mirroring.
- **Challenge Faced:** 3D lighting and performance degradation on lower-end client GPUs during pack opening.
- **Resolution:** Optimized geometry usage and implemented `RoomEnvironment` PBR image-based lighting for high performance.

### `ksudyn`
- **Contributions:** Designed card visual components, rarity neon glow effects, Creator cards, album/catalog filtering, pack store UI, and private chat interface.
- **Challenge Faced:** Hardcoded rarity color mappings became out of sync when tier definitions were updated mid-project.
- **Resolution:** Centralized rarity definitions into a single source of truth (`rarezas.js`) shared across UI components.

### `osmunoz-`
- **Contributions:** Acted as Project Manager (PM) / Scrum Master, facilitating team coordination, tracking project milestones, and removing technical obstacles during decision-making. Guided frontend-driven DB schema planning, extended GDPR compliance (CSV/HTML data export & email delivery), and consolidated the complete project README.
- **Challenge Faced:** Resolving architectural blockers and aligning decoupled UI component data needs with backend API contracts.
- **Resolution:** Facilitated cross-team communication between frontend and backend developers to streamline schema design and ensure full subject and GDPR documentation compliance.

---

## 10. Resources & AI Usage

### References
- [Django Documentation](https://docs.djangoproject.com/) & [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/) & [Vite Guide](https://vitejs.dev/)
- [42 Intra API Documentation](https://api.intra.42.fr/apidoc)
- [Three.js Documentation](https://threejs.org/docs/)
- [MDN Web Docs: Service Workers & PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

### AI Tool Usage
In accordance with 42 curriculum guidelines, AI assistance was utilized transparently for the following tasks:
- **Code Reviews & Refactoring:** Auditing pull requests before merging branches to identify syntax inconsistencies or potential edge cases.
- **Documentation & Translation:** Assisting with initial draft translations of UI text strings (subsequently audited and corrected by human team members).
- **Subject Compliance Audit:** Cross-referencing project features against 42 subject requirements.
- **Human Oversight:** All game rules, database schemas, API architecture, visual styling, and core business logic were designed, tested, and implemented by team members.

---

## 11. Known Limitations

- **Private Messaging:** Real-time chat operates via HTTP polling (3-second intervals) rather than WebSockets.
- **PWA Service Worker:** PWA offline capabilities are enabled specifically in production builds (`make pwa`) due to browser security restrictions on self-signed HTTPS certificates in local dev mode.
- **42 API Rate Limits:** Full campus sync (`make sync-full`) requires ~6-7 minutes due to 42 Intra API rate limits.
- **User Opt-Out:** If a student requests removal from the card album, their profile can be excluded via an opt-out filter list to prevent automatic re-creation during API syncs.
