# Training Data Collection - System Flow Diagrams

## 1. Data Collection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Student Interacts                           │
│  (Answers Quiz, Clicks Button, Views Page, Completes Module)   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Client-Side Tracker Captures Event                 │
│                                                                 │
│   trainingDataTracker.js                                        │
│   - Collects interaction details                               │
│   - Adds session context                                       │
│   - Calculates time metrics                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ POST with JWT token
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API Endpoint Receives Data                    │
│                                                                 │
│   /api/training-data/{type}                                    │
│   - Validates authentication                                    │
│   - Extracts userId from JWT                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│            Data Collection Service Processes                    │
│                                                                 │
│   dataCollectionService.js                                      │
│   - Anonymizes userId (SHA-256)                                │
│   - Enriches with user metadata                                │
│   - Validates data structure                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               MongoDB Stores Training Record                    │
│                                                                 │
│   trainingdatas collection                                      │
│   - Anonymized data                                            │
│   - Indexed for queries                                        │
│   - Timestamped                                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Available for ML Training                      │
│                                                                 │
│   - Export via admin dashboard                                 │
│   - Batch queries for large datasets                           │
│   - Statistics and analytics                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Quiz Answer Tracking Flow

```
Student answers quiz question
         │
         ▼
┌────────────────────────┐
│  QuizComponent         │
│  - Calculates time     │
│  - Checks correctness  │
└──────────┬─────────────┘
           │
           │ trackQuizAnswer()
           ▼
┌────────────────────────────────┐
│  useTrainingDataTracker()      │
│  - Adds session metrics        │
│  - Updates consecutive counts  │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  POST /api/training-data/      │
│       quiz-answer              │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  Stored in MongoDB:            │
│  {                             │
│    anonymizedUserId: "hash"    │
│    interactionType: "quiz_answer"│
│    questionId: ObjectId        │
│    answerCorrect: true         │
│    responseTime: 12            │
│    questionDifficulty: 0.5     │
│    consecutiveCorrect: 3       │
│    timestamp: Date             │
│  }                             │
└────────────────────────────────┘
```

## 3. Module Tracking Flow

```
Student starts module
         │
         ▼
┌─────────────────────────┐
│  useEffect() hook       │
│  - trackModuleStart()   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Student works on       │
│  module content         │
│  (time tracking)        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Cleanup function       │
│  - trackModuleComplete()│
│  - Calculate timeSpent  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Both events stored     │
│  in MongoDB             │
└─────────────────────────┘
```

## 4. Admin Data Export Flow

```
Admin logs in
     │
     ▼
┌──────────────────────────┐
│  Navigate to             │
│  /admin/training-data    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  TrainingDataDashboard   │
│  - Shows statistics      │
│  - Export options        │
└──────────┬───────────────┘
           │
           │ GET /api/training-data/stats
           ▼
┌──────────────────────────┐
│  View Statistics:        │
│  - Total records         │
│  - Unique users          │
│  - Interaction breakdown │
└──────────┬───────────────┘
           │
           │ Admin clicks Export
           ▼
┌──────────────────────────┐
│  Set filters:            │
│  - Date range            │
│  - Interaction type      │
│  - Limit                 │
└──────────┬───────────────┘
           │
           │ GET /api/training-data/export?filters
           ▼
┌──────────────────────────┐
│  Server queries MongoDB  │
│  - Applies filters       │
│  - Returns JSON data     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Browser downloads       │
│  training-data.json      │
└──────────────────────────┘
```

## 5. Session Tracking Flow

```
User logs in / App loads
         │
         ▼
┌─────────────────────────┐
│  tracker.setupAutoTracking()│
│  - Registers event listeners│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  trackSessionStart()    │
│  - Records start time   │
└──────────┬──────────────┘
           │
           │  User interacts...
           │
           ▼
┌─────────────────────────┐
│  beforeunload event     │
│  - trackSessionEnd()    │
│  - Uses sendBeacon      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Session data stored:   │
│  - Start/end times      │
│  - Total duration       │
└─────────────────────────┘
```

## 6. Data Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  React Components                                       │
│  ├── Quiz Components      ──→  trackQuizAnswer()       │
│  ├── Module Components    ──→  trackModuleStart()      │
│  ├── Navigation           ──→  trackPageView()         │
│  └── Buttons/Clicks       ──→  trackClick()            │
│                                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ React Hook / Tracker
                  │
┌─────────────────▼───────────────────────────────────────┐
│                     API Layer                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Authentication Middleware ──→ Verify JWT               │
│           │                                             │
│           ▼                                             │
│  Route Handlers ──────────────→ Process request         │
│           │                                             │
│           ▼                                             │
│  Authorization Check ──────────→ Verify role (admin)    │
│                                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   Service Layer                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Data Collection Service                                │
│  ├── Anonymization      ──→  SHA-256 hashing           │
│  ├── Data enrichment    ──→  User metadata             │
│  ├── Validation         ──→  Schema checks             │
│  └── Business logic     ──→  Consecutive counts        │
│                                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Mongoose ODM
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   Data Layer                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  MongoDB - trainingdatas collection                     │
│                                                         │
│  Indexes:                                               │
│  ├── { timestamp: -1 }                                 │
│  ├── { anonymizedUserId: 1 }                           │
│  ├── { interactionType: 1, timestamp: -1 }             │
│  ├── { questionId: 1 }                                 │
│  └── { moduleId: 1 }                                   │
│                                                         │
│  Documents: ~100K+ records over time                   │
│                                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Export
                  │
┌─────────────────▼───────────────────────────────────────┐
│            Machine Learning Pipeline (Future)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Data Preprocessing ──→ Feature Engineering             │
│           │                                             │
│           ▼                                             │
│  Model Training ──────→ IRT / Adaptive Algorithms       │
│           │                                             │
│           ▼                                             │
│  Model Evaluation ────→ A/B Testing                     │
│           │                                             │
│           ▼                                             │
│  Deploy Updated Model ──→ Improved predictions          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 7. Anonymization Process

```
Real User ID
"507f1f77bcf86cd799439011"
         │
         ▼
┌─────────────────────────┐
│  SHA-256 Hash Function  │
│                         │
│  Input: userId          │
│  Algorithm: SHA-256     │
└──────────┬──────────────┘
           │
           ▼
Anonymized ID
"a8b4c2d1e3f4...64 chars"
         │
         ▼
┌─────────────────────────┐
│  Stored in Database     │
│                         │
│  ✅ Not reversible      │
│  ✅ Consistent          │
│  ✅ Unique              │
└─────────────────────────┘

Benefits:
- Cannot identify real user
- Same user = same hash (pattern analysis)
- Privacy compliant
- GDPR friendly
```

## 8. Data Types & Schema

```
TrainingData Document
├── _id: ObjectId
├── anonymizedUserId: String (hash)
│
├── User Context (anonymized)
│   ├── userLevel: Number (theta)
│   └── userRole: String
│
├── Interaction Details
│   └── interactionType: Enum [
│       'quiz_answer',
│       'click',
│       'page_view',
│       'module_start',
│       'module_complete',
│       'path_generated',
│       'session_start',
│       'session_end'
│   ]
│
├── Quiz Data (if applicable)
│   ├── questionId: ObjectId
│   ├── questionDifficulty: Number
│   ├── answerCorrect: Boolean
│   └── responseTime: Number
│
├── Module Data (if applicable)
│   ├── moduleId: ObjectId
│   ├── moduleLevel: Number
│   └── moduleSkill: String
│
├── Engagement Metrics
│   ├── timeSpent: Number
│   ├── sessionDuration: Number
│   ├── consecutiveCorrect: Number
│   ├── consecutiveIncorrect: Number
│   └── sessionQuestionsAnswered: Number
│
├── Navigation Data (if applicable)
│   ├── elementClicked: String
│   ├── pageUrl: String
│   └── previousPage: String
│
├── Metadata
│   └── metadata: Mixed (flexible)
│
└── Timestamps
    ├── timestamp: Date
    ├── createdAt: Date
    └── updatedAt: Date
```

## 9. Performance Considerations

```
Client Side:
├── Non-blocking API calls
├── Silent error handling
├── Debounced tracking (where appropriate)
└── sendBeacon for page unload

Server Side:
├── Indexed queries
├── Batch operations
├── Async processing
└── Connection pooling

Database:
├── Compound indexes
├── Covered queries
├── Time-series optimization
└── Archive old data (365+ days)
```

## 10. Future ML Pipeline (Planned)

```
Training Data (MongoDB)
         │
         ▼
┌─────────────────────────┐
│  Data Export            │
│  - Batch queries        │
│  - JSON/CSV format      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Data Preprocessing     │
│  - Clean data           │
│  - Feature extraction   │
│  - Normalization        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Feature Engineering    │
│  - Response patterns    │
│  - Time-based features  │
│  - Performance metrics  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Model Training         │
│  - IRT parameter tuning │
│  - Difficulty estimation│
│  - Adaptive algorithms  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Model Evaluation       │
│  - Cross-validation     │
│  - A/B testing          │
│  - Performance metrics  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Deploy to Production   │
│  - Update parameters    │
│  - Monitor performance  │
│  - Continuous learning  │
└─────────────────────────┘
```
