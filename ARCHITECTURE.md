# Anapath System - Architecture Diagram

## System Overview

The Anapath System is a hospital information system for managing anatomical pathology examinations. It follows a monorepo structure with separate backend (NestJS) and frontend (Next.js) applications.

```mermaid
graph TB
    subgraph "External Services"
        PRES[Prescription Service]
        HOSP[Other Hospital Services]
    end
    
    subgraph "Backend - NestJS API"
        API[API Gateway]
        EXT[External Module]
        ANA[Anapath Module]
        NOT[Notification Module]
        DB[(PostgreSQL Database)]
        
        API --> EXT
        API --> ANA
        API --> NOT
        EXT --> ANA
        EXT --> NOT
        ANA --> DB
        NOT --> DB
    end
    
    subgraph "Frontend - Next.js"
        DASH[Dashboard]
        WORK[Worklist]
        VAL[Validation]
        ARCH[Archives]
        UI[Shared Components]
    end
    
    PRES -->|POST /external/anapath| API
    HOSP -->|POST /notifications| API
    
    DASH -->|REST API| API
    WORK -->|REST API| API
    VAL -->|REST API| API
    ARCH -->|REST API| API
    
    UI --> DASH
    UI --> WORK
    UI --> VAL
    UI --> ARCH
```

## Backend Architecture

### Module Structure

```mermaid
graph LR
    subgraph "App Module"
        CONFIG[Config Module]
        TYPEORM[TypeORM Module]
        ANA_MOD[Anapath Module]
        NOT_MOD[Notification Module]
        EXT_MOD[External Module]
    end
    
    subgraph "Anapath Module"
        ANA_CTRL[Anapath Controller]
        ANA_SVC[Anapath Service]
        ANA_ENT[AnapathRequest Entity]
        ANA_DTO[DTOs]
    end
    
    subgraph "Notification Module"
        NOT_CTRL[Notification Controller]
        NOT_SVC[Notification Service]
        NOT_ENT[Notification Entity]
        NOT_DTO[DTOs]
    end
    
    subgraph "External Module"
        EXT_CTRL[External Controller]
        EXT_DTO[DTOs]
    end
    
    ANA_MOD --> ANA_CTRL
    ANA_MOD --> ANA_SVC
    ANA_MOD --> ANA_ENT
    ANA_MOD --> ANA_DTO
    
    NOT_MOD --> NOT_CTRL
    NOT_MOD --> NOT_SVC
    NOT_MOD --> NOT_ENT
    NOT_MOD --> NOT_DTO
    
    EXT_MOD --> EXT_CTRL
    EXT_MOD --> EXT_DTO
    
    EXT_CTRL --> ANA_SVC
    EXT_CTRL --> NOT_SVC
```

### Database Schema

```mermaid
erDiagram
    ANAPATH_REQUEST ||--o{ NOTIFICATION : "generates"
    
    ANAPATH_REQUEST {
        uuid id PK
        string anapathId UK
        string patientId
        string episodeId
        string prescriptionId
        enum typeExamen
        boolean isExtemporane
        timestamp extemporaneDeadline
        jsonb prelevement
        jsonb resultat
        enum statut
        string validatedByUserId
        timestamp validatedAt
        string signedHash
        string motifAnnulation
        timestamp createdAt
        timestamp updatedAt
    }
    
    NOTIFICATION {
        uuid id PK
        enum type
        string title
        text message
        string priority
        string source
        jsonb metadata
        boolean read
        timestamp createdAt
    }
```

## Frontend Architecture

### Page Structure

```mermaid
graph TB
    subgraph "Next.js App Router"
        ROOT[Root Layout]
        HOME[Home /]
        DASH[Dashboard]
        WORK[Worklist]
        VAL[Validation]
        ARCH[Archives]
        RPT[Reports]
    end
    
    subgraph "Shared Components"
        THEME[ThemeProvider]
        SEARCH[SearchProvider]
        SIDEBAR[Sidebar]
        TOPBAR[TopBar]
        NOTIF[NotificationBell]
        FAB[FAB]
    end
    
    subgraph "Feature Components"
        KPI[KpiCard]
        URGENT[UrgentTable]
        TIMER[ExtemporaneTimer]
        CHART[WeeklyActivityChart]
        ARCH_TBL[ArchivesTable]
    end
    
    ROOT --> THEME
    ROOT --> SEARCH
    THEME --> HOME
    THEME --> DASH
    THEME --> WORK
    THEME --> VAL
    THEME --> ARCH
    THEME --> RPT
    
    DASH --> SIDEBAR
    DASH --> TOPBAR
    DASH --> KPI
    DASH --> URGENT
    DASH --> CHART
    
    WORK --> SIDEBAR
    WORK --> TOPBAR
    WORK --> NOTIF
    
    VAL --> SIDEBAR
    VAL --> TOPBAR
    VAL --> TIMER
    
    ARCH --> SIDEBAR
    ARCH --> TOPBAR
    ARCH --> ARCH_TBL
    
    TOPBAR --> NOTIF
    DASH --> FAB
    WORK --> FAB
```

### API Layer

```mermaid
graph LR
    subgraph "Frontend"
        PAGES[Pages]
        LIB[lib/api.ts]
        UTILS[Utilities]
    end
    
    subgraph "Backend"
        CTRL[Controllers]
        SVC[Services]
        DB[(Database)]
    end
    
    PAGES --> LIB
    LIB --> CTRL
    CTRL --> SVC
    SVC --> DB
    
    UTILS --> PAGES
```

## Request Workflow

```mermaid
stateDiagram-v2
    [*] --> CREEE: Prescription received
    CREEE --> EN_ATTENTE: Request processed
    EN_ATTENTE --> EN_COURS: Examination started
    EN_COURS --> RESULTAT_DISPONIBLE: Results entered
    RESULTAT_DISPONIBLE --> VALIDE: Pathologist validation
    VALIDE --> ARCHIVE: Report archived
    CREEE --> ANNULEE: Cancelled
    EN_ATTENTE --> ANNULEE: Cancelled
    EN_COURS --> ANNULEE: Cancelled
    RESULTAT_DISPONIBLE --> ANNULEE: Cancelled
    ARCHIVE --> [*]
    ANNULEE --> [*]
```

## API Endpoints

### Anapath Module
- `POST /anapath` - Create new examination request
- `GET /anapath` - List all requests
- `GET /anapath/:id` - Get request by ID
- `PATCH /anapath/:id` - Update request (results, status)
- `POST /anapath/:id/validate` - Validate with digital signature

### Notification Module
- `POST /notifications` - Receive notification (standard or legacy format)
- `GET /notifications` - List all notifications
- `GET /notifications/unread/count` - Count unread notifications
- `PATCH /notifications/read-all` - Mark all as read
- `PATCH /notifications/:id/read` - Mark as read

### External Module
- `POST /external/anapath` - Receive prescription from external service

## Key Technologies

- **Backend**: NestJS 10, TypeORM, PostgreSQL 16
- **Frontend**: Next.js 15/19, React, TailwindCSS, Axios
- **Deployment**: Render (PaaS)
- **Documentation**: Swagger/OpenAPI

## Data Flow

1. **Prescription Intake**: External services send prescriptions to `/external/anapath`
2. **Request Creation**: ExternalController creates AnapathRequest and triggers notification
3. **Lab Processing**: Pathologists view worklist, update results via `/anapath/:id`
4. **Validation**: Pathologist validates with digital signature via `/anapath/:id/validate`
5. **Archiving**: Validated reports are archived and can be exported as PDF
6. **Notifications**: Real-time alerts between services via notification system

## Security Features

- Digital signature for validation (signedHash)
- Service-to-service authentication via x-service-id header
- Role-based access (implied by validation workflow)
- SSL/TLS for database connections
