# Project Documentation — Code to Win

## 1. Executive Summary

Code to Win is a full-stack institutional platform that consolidates coding performance metrics from major competitive programming ecosystems and turns them into verifiable, role-based operational intelligence.

It enables:

- Student progress visibility
- Faculty verification workflows
- HOD-level academic oversight
- Admin-level governance and analytics

---

## 2. Main Idea & Objective

## Problem Statement

Educational institutions struggle to track coding competency consistently because student activity is fragmented across multiple external platforms.

## Objective

Create a unified system that:

1. Collects coding data automatically
2. Normalizes and stores it reliably
3. Computes transparent rankings
4. Serves role-specific dashboards
5. Supports reporting/export for placement and academics

---

## 3. End-to-End System View

```mermaid
graph LR
  subgraph Users
    S[Student]
    F[Faculty]
    H[HOD]
    A[Admin]
  end

  subgraph Client Apps
    W[Web App - React]
    M[Mobile App - React Native]
  end

  subgraph Backend
    API[Express API]
    AUTH[JWT + Role Validation]
    SCR[Scraper Engine]
    RANK[Ranking Engine]
    REP[Reporting/Export]
  end

  subgraph Data
    DB[(MySQL)]
    FS[(Uploads/Exports)]
    LOG[(Logs)]
  end

  S --> W
  F --> W
  H --> W
  A --> W
  S --> M
  F --> M
  H --> M

  W --> API
  M --> API

  API --> AUTH
  API --> SCR
  API --> RANK
  API --> REP

  AUTH --> DB
  SCR --> DB
  RANK --> DB
  REP --> DB
  REP --> FS
  API --> LOG
```

---

## 4. Detailed Workflow Explanation

## 4.1 User Access Workflow

```mermaid
flowchart TD
  U1[User enters credentials] --> U2[Auth API login]
  U2 --> U3{Credentials + role valid?}
  U3 -->|No| U4[Return error]
  U3 -->|Yes| U5[Issue JWT]
  U5 --> U6[Validate token on bootstrap]
  U6 --> U7[Load role profile + metadata]
  U7 --> U8[Render role-specific dashboard]
```

## 4.2 Coding Profile Verification Workflow

```mermaid
flowchart LR
  P1[Student submits profile IDs] --> P2[Faculty/HOD review queue]
  P2 --> P3{Approve?}
  P3 -->|Yes| P4[Set accepted + enable tracking]
  P3 -->|No| P5[Set rejected/suspended]
  P4 --> P6[Student notified]
  P5 --> P6
```

## 4.3 Performance Update Workflow

```mermaid
sequenceDiagram
  participant Cron as Scheduler
  participant Engine as Scraper Engine
  participant Platform as External Platform
  participant DB as MySQL
  participant Notify as Notification Module

  Cron->>Engine: Start scheduled update
  Engine->>DB: Fetch active profile mappings
  loop Each profile
    Engine->>Platform: Collect data
    Platform-->>Engine: Raw metrics
    Engine->>Engine: Parse + normalize
    alt Success
      Engine->>DB: Update performance rows
      Engine->>Notify: Reactivation notice if needed
    else Failure
      Engine->>Engine: Retry
      Engine->>DB: Mark suspended after threshold
      Engine->>Notify: Suspension notice
    end
  end
  Engine->>DB: Trigger/refresh rankings
```

---

## 5. Module Breakdown and Responsibilities

## 5.1 Backend Core Modules

- **Authentication module**: login, registration, token validation
- **Role route modules**: student/faculty/hod/admin operational APIs
- **Scraper modules**: platform adapters for LeetCode/CodeChef/GFG/HackerRank/GitHub
- **Ranking module**: score computation and ordered ranking outputs
- **Analytics module**: KPI and progress trends
- **Report/export module**: generation and retrieval of artifacts
- **Middleware module**: visitor tracking, upload handling
- **Scheduling module**: periodic ingestion and maintenance jobs

## 5.2 Frontend Modules (Web)

- Auth context and protected routes
- Role-specific dashboards
- Ranking and filter components
- Modal workflows for profile and governance operations
- Analytics and export interfaces

## 5.3 Frontend Modules (Mobile)

- Token persistence via AsyncStorage
- Role-aware navigation stack/tab model
- Student/faculty/HOD optimized mobile screens
- Notification and quick status visibility

---

## 6. Data Flow & Execution Flow

### 6.1 Request-Level Execution Flow

```mermaid
flowchart TD
  R1[Incoming request] --> R2[Express middleware chain]
  R2 --> R3[Visitor tracker + logger]
  R3 --> R4[Route dispatch]
  R4 --> R5[Validation + business logic]
  R5 --> R6[DB/Scraper/Report operation]
  R6 --> R7[Structured response]
```

### 6.2 Ranking Execution Flow

```mermaid
flowchart LR
  K1[Read latest platform metrics] --> K2[Apply grading weights]
  K2 --> K3[Compute platform subtotal]
  K3 --> K4[Compute final composite score]
  K4 --> K5[Sort + assign rank]
  K5 --> K6[Persist rank snapshots]
  K6 --> K7[Expose in ranking APIs]
```

### 6.3 Reporting Execution Flow

```mermaid
flowchart TD
  E1[User selects report/export filters] --> E2[API receives request]
  E2 --> E3[Query + aggregate data]
  E3 --> E4[Generate Excel/PDF artifact]
  E4 --> E5[Store artifact path]
  E5 --> E6[Return download link/response]
```

---

## 7. Architecture Diagram (Detailed)

```mermaid
graph TD
  subgraph UI
    CWEB[Client Web]
    CMOB[Client Mobile]
  end

  subgraph API_Layer
    API[Express Server]
    MW1[Auth Middleware]
    MW2[Visitor Tracking]
    RT[Domain Routes]
  end

  subgraph Services
    SV1[Scraper Service]
    SV2[Ranking Service]
    SV3[Analytics Service]
    SV4[Report Service]
  end

  subgraph Persistence
    MYSQL[(MySQL)]
    STORE[(Upload/Export Storage)]
    WLOG[(Winston Logs)]
  end

  subgraph External
    X1[LeetCode]
    X2[CodeChef]
    X3[GeeksforGeeks]
    X4[HackerRank]
    X5[GitHub]
    X6[SMTP]
  end

  CWEB --> API
  CMOB --> API

  API --> MW1 --> RT
  API --> MW2

  RT --> SV1
  RT --> SV2
  RT --> SV3
  RT --> SV4

  SV1 --> MYSQL
  SV2 --> MYSQL
  SV3 --> MYSQL
  SV4 --> MYSQL
  SV4 --> STORE

  SV1 --> X1
  SV1 --> X2
  SV1 --> X3
  SV1 --> X4
  SV1 --> X5
  RT --> X6

  API --> WLOG
```

---

## 8. Tech Stack and Rationale

| Technology | Role | Rationale |
|---|---|---|
| React + Vite | Web UX | Fast build pipeline, route-driven dashboards |
| React Native + Expo | Mobile UX | Efficient multi-platform mobile delivery |
| Node.js + Express | API | Flexible modular REST backend |
| MySQL | Data model | Strong relational fit for role/profile/performance data |
| JWT + bcrypt | Security | Stateless auth and secure credential handling |
| node-cron | Automation | Predictable scheduled maintenance and data refresh |
| Cheerio/Axios/Puppeteer | Scraping | Handles static and dynamic data surfaces |
| Winston | Observability | Structured operational logging |

---

## 9. Problem-Solving Approach

- **Fragmentation challenge** solved by unifying profile metrics into normalized schema
- **Freshness challenge** solved by cron schedules + manual refresh routes
- **Data quality challenge** solved by retry/suspend/reactivate lifecycle
- **Governance challenge** solved through role-bound APIs and UX flows
- **Decision support challenge** solved via ranking + analytics + export layer

---

## 10. Advantages, Benefits, Pros and Cons

## Benefits / Pros

- Institutional visibility of coding readiness
- Lower manual operational burden
- Strong role separation and accountability
- Portable architecture supporting web and mobile channels
- Data-driven placement and academic review workflows

## Limitations / Cons

- Scraping reliability can change with external platform updates
- Requires careful endpoint/port consistency between clients and backend
- Scheduling and scraping workloads need monitoring in production
- Some advanced admin operations are web-only by design in mobile flow

---

## 11. Crucial Components & Integration Details

- **Auth integration**: token issuance and validation governs all protected workflows
- **Scraper integration**: each platform adapter maps to common metric format
- **Notification integration**: profile status transitions produce user-facing alerts
- **Export integration**: report generation persists artifacts for retrieval
- **Ops integration**: PM2-friendly backend process model + scheduled jobs

---

## 12. Deployment & Local Run Guidance

## Backend

```bash
cd backend
npm install
npm run dev
```

## Web

```bash
cd client
npm install
npm run dev
```

## Mobile

```bash
cd mobile
npm install
npm start
```

## Validation

```bash
cd backend && npm test
cd ../client && npm run lint && npm run build
cd ../mobile && npm run lint
```

---

## 13. Operational Recommendations

- Keep `PORT` and client API targets aligned (`client/vite.config.js`, `mobile/src/utils.jsx`)
- Monitor scheduled jobs and scraper failures via logs
- Version and review grading rules for ranking consistency
- Add automated integration tests around critical auth/ranking/report endpoints

---

## 14. Final Notes

This project is architected as a practical production system for educational institutions. It combines automation, governance, analytics, and user experience in a coherent structure that is both extensible and operationally effective.
