# Initial Path Generation - System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

    New User                 Existing User
       │                           │
       ├─── Login ────────────────┤
       │                           │
       ▼                           ▼
  Dashboard.jsx              Dashboard.jsx
       │                           │
       ├── useEffect() ───────────┤
       │                           │
       ▼                           ▼
 checkNeedsGeneration()    checkNeedsGeneration()
       │                           │
       ├─── API GET ──────────────┤
       │                           │
       ▼                           ▼
   needsGeneration:          needsGeneration:
       true                        false
       │                           │
       ▼                           │
InitialPathGenerator          Load Questions
       │                           │
   ┌───┴────┐                      │
   │ Step 1 │ Welcome              │
   └───┬────┘                      │
       │                           │
   ┌───┴────┐                      │
   │ Step 2 │ Select Skills        │
   └───┬────┘                      │
       │                           │
   ┌───┴────┐                      │
   │ Step 3 │ Generate             │
   └───┬────┘                      │
       │                           │
       ├─── API POST ──────────────┤
       │                           │
       ▼                           ▼
  Path Generated            Normal Dashboard
       │                           │
       └──────── Continue ─────────┘
                  │
                  ▼
            Learning Flow


┌─────────────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICE ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────┘

  API Layer                 Service Layer              Data Layer
  (index.js)           (pathGenerationService.js)    (MongoDB Models)
      │                          │                          │
      │                          │                          │
POST /path/generate ──────► generateInitialPath() ──────► UserModel
      │                          │                          │
      │                     ┌────┴────┐                     │
      │                     │         │                     │
      │                     ▼         ▼                     │
      │              thetaToLevel()  calculateModuleFit()  │
      │                     │              │               │
      │                     └──────┬───────┘               │
      │                            │                       │
      │                            ▼                       │
      │              generateSkillRecommendations() ◄──── ModuleModel
      │                            │                       │
      │                            ▼                       │
      │                  Interleave modules               │
      │                            │                       │
      │                            ▼                       │
      │              generateAssessmentSchedule()         │
      │                            │                       │
      │                            ▼                       │
      │                  identifyFocusAreas()             │
      │                            │                       │
      │                            ▼                       │
      │                  estimatePathDuration()           │
      │                            │                       │
      │                            ▼                       │
      │                   generateNextSteps()             │
      │                            │                       │
      ◄────────────────────── Return Path ────────────────┘
      │
      ▼
  Client receives
  complete path object


┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW DIAGRAM                                │
└─────────────────────────────────────────────────────────────────────────┘

User Input
    │
    ├── Skills: [reading, writing, listening, speaking]
    └── Scores: { reading: 60, writing: 55, listening: 65, speaking: 50 }
              │
              ▼
        Calculate Avg
         (57.5)
              │
              ▼
    Map to Theta Scale
    (57.5/100 * 6 - 3)
    = 0.45
              │
              ▼
        User.theta = 0.45
              │
              ▼
    Load All Modules
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
 Reading  Writing  Listening  Speaking
    │         │         │         │
    ▼         ▼         ▼         ▼
Calculate   ...      ...       ...
FitScore
    │
    ▼
Sort by Fit
    │
    ▼
Take Top 5
    │
    └──────┬───────────┬──────────┘
           │           │
           ▼           ▼
    Interleave    Add Priorities
           │
           ▼
   Return Modules
           │
           ▼
    Client Displays
        Path


┌─────────────────────────────────────────────────────────────────────────┐
│                      MODULE FIT CALCULATION                              │
└─────────────────────────────────────────────────────────────────────────┘

For each module:

1. Calculate Average Difficulty
   ┌──────────────────────────┐
   │ Σ(item.difficulty)       │
   │ ──────────────────       │
   │    items.length          │
   └──────────────────────────┘
            │
            ▼
      avgDifficulty

2. Determine Ideal Difficulty (Zone of Proximal Development)
   ┌──────────────────────────┐
   │ idealDifficulty =        │
   │   userTheta + 0.3        │
   └──────────────────────────┘
            │
            ▼
      idealDifficulty

3. Calculate Difficulty Gap
   ┌──────────────────────────┐
   │ difficultyGap =          │
   │   |avgDifficulty -       │
   │    idealDifficulty|      │
   └──────────────────────────┘
            │
            ▼
      difficultyGap

4. Compute Fit Score
   ┌──────────────────────────┐
   │ fitScore =               │
   │   100 * e^(-gap)         │
   └──────────────────────────┘
            │
            ▼
        fitScore

Example:
- userTheta = 0.5
- avgDifficulty = 0.8
- idealDifficulty = 0.5 + 0.3 = 0.8
- difficultyGap = |0.8 - 0.8| = 0
- fitScore = 100 * e^0 = 100 (perfect match!)


┌─────────────────────────────────────────────────────────────────────────┐
│                     COMPONENT HIERARCHY                                  │
└─────────────────────────────────────────────────────────────────────────┘

App.jsx
  │
  └── Dashboard.jsx
        │
        ├── [State: needsPathGeneration]
        │     │
        │     ├── true
        │     │   └── InitialPathGenerator
        │     │         │
        │     │         ├── Step 1: Welcome
        │     │         │     └── Feature cards
        │     │         │         ├── Target icon
        │     │         │         ├── TrendingUp icon
        │     │         │         └── BookOpen icon
        │     │         │
        │     │         ├── Step 2: Selection
        │     │         │     ├── Skill checkboxes
        │     │         │     └── Score sliders
        │     │         │
        │     │         └── Step 3: Confirmation
        │     │               ├── Summary display
        │     │               └── Generate button
        │     │
        │     └── false
        │           └── Normal Dashboard
        │                 ├── Question Card
        │                 └── Action Buttons
        │                       └── View Learning Path
        │                             └── LearningPath.jsx
        │
        └── Header
              ├── Welcome message
              └── Navigation buttons


┌─────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT                                 │
└─────────────────────────────────────────────────────────────────────────┘

Dashboard.jsx State:
┌────────────────────────────┐
│ needsPathGeneration: bool  │ Controls wizard display
│ checkingPath: bool         │ Loading indicator
│ generatedPath: object      │ Stores result
│ showPath: bool             │ Toggle path view
│ question: object           │ Current question
│ answer: string             │ User input
│ status: string             │ Feedback message
│ isLoading: bool            │ Question loading
└────────────────────────────┘

InitialPathGenerator.jsx State:
┌────────────────────────────┐
│ step: number (1-3)         │ Wizard navigation
│ loading: bool              │ Generation in progress
│ externalScores: object     │ User scores
│ hasExternalScores: bool    │ Toggle for scores
│ selectedSkills: array      │ Chosen skills
└────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                  │
└─────────────────────────────────────────────────────────────────────────┘

UserModel
┌────────────────────────────┐
│ _id: ObjectId              │
│ username: String (unique)  │
│ password: String (hashed)  │
│ theta: Number (default: 0) │ ◄── Updated by path generation
│ role: String               │
│ email: String              │
│ firstName: String          │
│ lastName: String           │
│ createdAt: Date            │
│ updatedAt: Date            │
└────────────────────────────┘

ModuleModel
┌────────────────────────────┐
│ _id: ObjectId              │
│ title: String              │
│ skill: String              │ ◄── reading/writing/listening/speaking
│ level: Number              │ ◄── 0-5 (A1-C2)
│ description: String        │
│ items: [ItemSchema]        │
│   ├── title: String        │
│   ├── type: String         │
│   ├── difficulty: Number   │ ◄── Used for fit calculation
│   ├── discrimination: Num  │
│   └── questionId: Number   │
│ createdAt: Date            │
│ updatedAt: Date            │
└────────────────────────────┘

ResponseModel
┌────────────────────────────┐
│ _id: ObjectId              │
│ user: ObjectId             │ ◄── Used to check if new user
│ question: ObjectId         │
│ correct: Boolean           │
│ nextReview: Date           │
│ timestamp: Date            │
└────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      ALGORITHM COMPLEXITY                                │
└─────────────────────────────────────────────────────────────────────────┘

Function                          Time Complexity    Space Complexity
─────────────────────────────────────────────────────────────────────────
generateInitialPath()             O(n log n)         O(n)
  ├── Load modules                O(n)               O(n)
  ├── For each skill:
  │   └── generateSkillRecs()     O(n log n)         O(n)
  │       ├── Filter              O(n)               O(k)
  │       ├── Calculate fit       O(n * m)           O(n)
  │       └── Sort                O(n log n)         O(1)
  └── Interleave                  O(k)               O(k)

Where:
  n = total number of modules
  m = average items per module
  k = modules per skill (typically 5)

Overall: O(n log n) time, O(n) space


┌─────────────────────────────────────────────────────────────────────────┐
│                      SECURITY CONSIDERATIONS                             │
└─────────────────────────────────────────────────────────────────────────┘

1. Authentication
   ┌────────────────────────────┐
   │ All endpoints require JWT  │
   │ Token verified on server   │
   │ userId extracted from JWT  │
   └────────────────────────────┘

2. Input Validation
   ┌────────────────────────────┐
   │ Scores: 0-100 range        │
   │ Skills: whitelist check    │
   │ UserId: ObjectId valid     │
   └────────────────────────────┘

3. Rate Limiting (TODO)
   ┌────────────────────────────┐
   │ Max 5 generations/hour     │
   │ Prevent spam/abuse         │
   └────────────────────────────┘

4. Data Privacy
   ┌────────────────────────────┐
   │ No sensitive data logged   │
   │ Scores not shared          │
   │ Anonymized analytics       │
   └────────────────────────────┘
```
