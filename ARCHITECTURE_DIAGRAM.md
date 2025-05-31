# PLATE RESTAURANT SYSTEM - ARCHITECTURE DIAGRAM

## System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js App Router]
        Components[React Components]
        Hooks[Custom Hooks]
        Utils[Utility Functions]
    end
    
    subgraph "Authentication Layer"
        Auth[Supabase Auth]
        RLS[Row Level Security]
        Middleware[Auth Middleware]
        Roles[Role Management]
    end
    
    subgraph "Application Layer"
        API[API Routes]
        Voice[Voice Processing]
        RealTime[Real-time Updates]
        State[State Management]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI GPT-4]
        Supabase[Supabase Backend]
        Vercel[Vercel Hosting]
    end
    
    subgraph "Database Layer"
        DB[(PostgreSQL)]
        Migrations[Database Migrations]
        Indexes[Indexes & Constraints]
    end
    
    UI --> Components
    Components --> Hooks
    Hooks --> Utils
    UI --> Auth
    Auth --> RLS
    Auth --> Middleware
    Middleware --> Roles
    UI --> API
    API --> Voice
    Voice --> OpenAI
    API --> RealTime
    RealTime --> Supabase
    State --> Hooks
    Supabase --> DB
    DB --> Migrations
    DB --> Indexes
    Vercel --> UI
```

## Detailed Component Architecture

```mermaid
graph LR
    subgraph "App Router Structure"
        Root[app/layout.tsx]
        Auth[app/(auth)/layout.tsx]
        Pages[Route Pages]
        API[app/api/*]
    end
    
    subgraph "Component Library"
        UI[components/ui/*]
        Domain[Domain Components]
        KDS[components/kds/*]
        FloorPlan[components/floor-plan/*]
    end
    
    subgraph "Business Logic"
        ModAssembly[lib/modassembly/*]
        Hooks[lib/hooks/*]
        Utils[lib/utils.ts]
    end
    
    Root --> Auth
    Auth --> Pages
    Root --> API
    Pages --> Domain
    Domain --> UI
    Domain --> KDS
    Domain --> FloorPlan
    Domain --> Hooks
    Hooks --> ModAssembly
    Hooks --> Utils
    API --> ModAssembly
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant Auth as Auth Layer
    participant API as API Routes
    participant DB as Database
    participant OpenAI as OpenAI API
    participant RT as Real-time
    
    User->>UI: Interact with app
    UI->>Auth: Check authentication
    Auth->>DB: Validate session
    DB-->>Auth: Return user data
    Auth-->>UI: Authentication status
    
    User->>UI: Place voice order
    UI->>API: Send audio data
    API->>OpenAI: Transcribe audio
    OpenAI-->>API: Return transcript
    API->>DB: Store order
    DB->>RT: Trigger real-time update
    RT-->>UI: Update kitchen display
```

## Voice Ordering System Flow

```mermaid
flowchart TD
    Start([User starts voice order])
    Record[Record audio]
    Upload[Upload to transcription API]
    Transcribe[OpenAI processes audio]
    Parse[Parse transcript to items]
    Validate[Validate order data]
    Store[Store in database]
    Update[Real-time update to KDS]
    Complete([Order visible in kitchen])
    
    Start --> Record
    Record --> Upload
    Upload --> Transcribe
    Transcribe --> Parse
    Parse --> Validate
    Validate --> Store
    Store --> Update
    Update --> Complete
    
    Transcribe -->|Error| Retry[Retry transcription]
    Retry --> Transcribe
    Parse -->|Invalid| Error[Show error to user]
    Error --> Start
```

## Kitchen Display System Architecture

```mermaid
graph TB
    subgraph "Kitchen Display System"
        KDS[KDS Layout]
        Orders[Order Cards]
        Groups[Table Groups]
        Voice[Voice Commands]
        Status[Status Management]
    end
    
    subgraph "Real-time Data"
        Subscribe[Supabase Subscriptions]
        Updates[Order Updates]
        Filters[Status Filters]
    end
    
    subgraph "Data Layer"
        OrderDB[(Orders Table)]
        TableDB[(Tables Table)]
        SeatDB[(Seats Table)]
    end
    
    KDS --> Orders
    KDS --> Groups
    KDS --> Voice
    Orders --> Status
    Groups --> Orders
    Voice --> Status
    
    Subscribe --> Updates
    Updates --> Filters
    Filters --> KDS
    
    OrderDB --> Subscribe
    TableDB --> Subscribe
    SeatDB --> Subscribe
```

## Authentication & Authorization Flow

```mermaid
graph TD
    Login[User Login]
    Validate[Validate Credentials]
    JWT[Generate JWT Token]
    Cookie[Set Secure Cookie]
    RLS[Apply RLS Policies]
    Access[Grant Access]
    
    Login --> Validate
    Validate -->|Valid| JWT
    Validate -->|Invalid| Error[Authentication Error]
    JWT --> Cookie
    Cookie --> RLS
    RLS --> Access
    
    subgraph "Role-Based Access"
        Admin[Admin Routes]
        Server[Server Routes]
        Kitchen[Kitchen Routes]
        Bar[Bar Routes]
    end
    
    Access --> Admin
    Access --> Server
    Access --> Kitchen
    Access --> Bar
```

## Database Schema Relationships

```mermaid
erDiagram
    profiles ||--o{ orders : "resident_id"
    profiles ||--o{ orders : "server_id"
    profiles ||--o{ seats : "resident_id"
    tables ||--o{ seats : "table_id"
    tables ||--o{ orders : "table_id"
    seats ||--o{ orders : "seat_id"
    
    profiles {
        uuid id PK
        text role
        text name
        timestamp created_at
    }
    
    tables {
        uuid id PK
        text table_id UK
        text label
        text type
        text status
        numeric x_position
        numeric y_position
    }
    
    seats {
        uuid id PK
        text seat_id UK
        uuid table_id FK
        uuid resident_id FK
        numeric x_position
        numeric y_position
    }
    
    orders {
        uuid id PK
        uuid table_id FK
        uuid seat_id FK
        uuid resident_id FK
        uuid server_id FK
        jsonb items
        text transcript
        text status
        text type
        timestamp created_at
    }
```

## Security Architecture

```mermaid
graph TB
    subgraph "Frontend Security"
        Input[Input Sanitization]
        CSRF[CSRF Protection]
        XSS[XSS Prevention]
        Validation[Client Validation]
    end
    
    subgraph "API Security"
        Auth[Authentication Check]
        Rate[Rate Limiting]
        Sanitize[Server Sanitization]
        Validate[Server Validation]
    end
    
    subgraph "Database Security"
        RLS[Row Level Security]
        Policies[Access Policies]
        Encryption[Data Encryption]
        Audit[Audit Logging]
    end
    
    Input --> Auth
    CSRF --> Auth
    XSS --> Auth
    Validation --> Auth
    
    Auth --> Rate
    Rate --> Sanitize
    Sanitize --> Validate
    
    Validate --> RLS
    RLS --> Policies
    Policies --> Encryption
    Encryption --> Audit
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Local[Local Development]
        MCP[MCP Servers]
        HTTPS[HTTPS Certificates]
    end
    
    subgraph "Production"
        Vercel[Vercel Edge Network]
        CDN[Global CDN]
        Functions[Edge Functions]
    end
    
    subgraph "Backend Services"
        Supabase[Supabase Cloud]
        PostgreSQL[(PostgreSQL)]
        Auth[Auth Service]
        Realtime[Realtime Service]
        Storage[File Storage]
    end
    
    subgraph "External APIs"
        OpenAI[OpenAI API]
        Maps[Map Services]
    end
    
    Local --> MCP
    Local --> HTTPS
    Local --> Supabase
    
    Vercel --> CDN
    Vercel --> Functions
    CDN --> Supabase
    Functions --> Supabase
    
    Supabase --> PostgreSQL
    Supabase --> Auth
    Supabase --> Realtime
    Supabase --> Storage
    
    Functions --> OpenAI
    Functions --> Maps
```

## Performance Optimization Points

```mermaid
graph LR
    subgraph "Frontend Optimizations"
        CodeSplit[Code Splitting]
        LazyLoad[Lazy Loading]
        Memoization[React Memoization]
        Bundle[Bundle Optimization]
    end
    
    subgraph "API Optimizations"
        Caching[Response Caching]
        Compression[Data Compression]
        Parallel[Parallel Processing]
        Batching[Request Batching]
    end
    
    subgraph "Database Optimizations"
        Indexes[Strategic Indexing]
        Queries[Query Optimization]
        Connection[Connection Pooling]
        RealTimeOpt[Realtime Optimization]
    end
    
    CodeSplit --> Caching
    LazyLoad --> Compression
    Memoization --> Parallel
    Bundle --> Batching
    
    Caching --> Indexes
    Compression --> Queries
    Parallel --> Connection
    Batching --> RealTimeOpt
```

## Technology Stack Layers

```ascii
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                       │
│  Next.js 15 • React 19 • TypeScript • Tailwind CSS    │
│  shadcn/ui • Framer Motion • Lucide Icons             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                       │
│  Custom Hooks • Voice Processing • Real-time Updates   │
│  State Management • Error Boundaries • Performance     │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   BUSINESS LAYER                        │
│  Modular Assembly • Repository Pattern • Validation    │
│  Order Processing • Suggestion Engine • Floor Plans    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   SECURITY LAYER                        │
│  Authentication • Authorization • RLS • Input Sanit.   │
│  Rate Limiting • CSRF Protection • Secure Cookies      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                           │
│  Supabase • PostgreSQL • Real-time • File Storage      │
│  Migrations • Indexes • Constraints • Backup           │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                    │
│  Vercel Edge • CDN • OpenAI API • Monitoring           │
│  SSL/TLS • Edge Functions • Global Distribution        │
└─────────────────────────────────────────────────────────┘
```

---

*This architecture diagram provides a comprehensive visual representation of the Plate Restaurant System's structure, data flow, and component relationships. It serves as a reference for understanding the system's design and planning future enhancements.*