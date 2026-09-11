# Initial Path Generation System

## Overview

The Initial Path Generation System creates personalized learning paths for students based on their skill level, goals, and optional diagnostic scores. This feature is automatically triggered when a new user first accesses the Dashboard.

## Features

### 1. **Automatic Detection**
- System automatically detects if a user is new (no previous responses)
- Triggers the path generation wizard on first Dashboard visit
- Seamless integration with existing learning flow

### 2. **Three-Step Generation Wizard**

#### Step 1: Welcome & Introduction
- Overview of adaptive learning features
- Explanation of personalized paths
- Key benefits display (Target matching, Adaptive difficulty, Four skills)

#### Step 2: Skill Selection & Diagnostic
- Select target skills (Reading, Writing, Listening, Speaking)
- Optional external test scores input (0-100 scale per skill)
- Slider controls for fine-tuned score entry
- Multiple skill selection supported

#### Step 3: Confirmation & Generation
- Review selected preferences
- Display chosen skills and scores
- One-click path generation
- Loading state with user feedback

### 3. **Intelligent Path Algorithm**

The system uses several algorithms to create optimal learning paths:

#### Theta-to-Level Mapping
```javascript
Theta < -1.5: Level 0 (Pre-A1 / Diagnostic)
Theta < -0.5: Level 1 (A1 Foundations)
Theta < 0.5:  Level 2 (A2 Elementary)
Theta < 1.5:  Level 3 (B1 Intermediate)
Theta < 2.5:  Level 4 (B2 Upper-Intermediate)
Theta >= 2.5: Level 5 (C1-C2 Advanced)
```

#### Module Fit Calculation
- Uses Item Response Theory (IRT) 2PL model
- Calculates expected correctness probability
- Targets "zone of proximal development" (theta + 0.3)
- Scores modules based on difficulty alignment

#### Skill-Specific Recommendations
- Generates top 5 modules per skill
- Prioritizes by fit score and level proximity
- Balances different skill areas
- Interleaves modules for variety

### 4. **Path Composition**

Generated paths include:

- **Prioritized Modules**: Ranked by relevance and fit
- **Skill Breakdown**: Recommendations organized by skill area
- **Assessment Schedule**: 
  - Diagnostic (for beginners)
  - Formative (every 3-5 modules)
  - Summative (every 2 weeks)
- **Focus Areas**: Identified weak spots and priorities
- **Duration Estimates**: Time to complete path
- **Next Steps**: Actionable guidance for learners

## API Endpoints

### POST `/api/path/generate`
Generate initial learning path for authenticated user.

**Request Body:**
```json
{
  "externalScores": {
    "reading": 50,
    "writing": 45,
    "listening": 60,
    "speaking": 40
  },
  "targetSkills": ["reading", "writing", "listening", "speaking"]
}
```

**Response:**
```json
{
  "userId": "user123",
  "generatedAt": "2025-12-14T10:30:00Z",
  "userTheta": 0.2,
  "suggestedLevel": 2,
  "modules": [...],
  "pathBySkill": {...},
  "assessmentSchedule": {...},
  "recommendations": {
    "focusAreas": [...],
    "estimatedDuration": {...},
    "nextSteps": [...]
  }
}
```

### GET `/api/path/needs-generation`
Check if user needs initial path generation.

**Response:**
```json
{
  "needsGeneration": true
}
```

### POST `/api/path/regenerate`
Regenerate path based on recent performance (last 30 days).

**Response:** Same structure as generate endpoint

## Service Functions

### `generateInitialPath(userId, options)`
Main path generation function.

**Options:**
- `externalScores`: Optional diagnostic scores object
- `includeOnboarding`: Whether to include onboarding module (default: true)
- `targetSkills`: Array of skills to focus on

### `regeneratePath(userId)`
Updates path based on recent performance data.

### `needsInitialPath(userId)`
Checks if user has any response history.

### `updatePathOnCompletion(userId, moduleId)`
Triggers path update every 5 completed modules.

## External Score Integration

The system can integrate external test scores (e.g., TOEFL, IELTS, placement tests):

1. Scores provided on 0-100 scale per skill
2. Average calculated across all skills
3. Mapped to theta scale (-3 to 3)
4. User's initial theta updated in database

**Mapping Formula:**
```javascript
theta = (avgScore / 100) * 6 - 3
```

Examples:
- Score 0 → theta = -3 (beginner)
- Score 50 → theta = 0 (intermediate)
- Score 100 → theta = 3 (advanced)

## Adaptive Updates

Paths automatically adapt as students progress:

- **Every 5 modules**: Check for path update
- **Performance analysis**: Identifies weak/strong skills
- **Dynamic adjustment**: Recommends remedial or enrichment content
- **Spaced repetition**: Schedules review of challenging items

## UI Components

### `InitialPathGenerator.jsx`
Three-step wizard component with:
- Progress indicator
- Skill selection checkboxes
- Score input sliders
- Animated transitions
- Loading states

### Dashboard Integration
- Automatic detection on mount
- Loading screen during check
- Seamless transition to path generator
- Return to normal flow after generation

## Usage Example

```javascript
// Check if user needs path
const result = await checkNeedsGeneration(token);

if (result.needsGeneration) {
  // Generate path with options
  const path = await generateInitialPath(token, {
    externalScores: {
      reading: 65,
      writing: 55,
      listening: 70,
      speaking: 50
    },
    targetSkills: ['reading', 'writing']
  });
}
```

## Future Enhancements

1. **ML-Enhanced Scoring**: Use machine learning to better predict optimal difficulty
2. **Multi-Language Paths**: Support for learning multiple languages
3. **Social Learning**: Peer comparison and group learning paths
4. **Gamification**: Achievements and milestones in path
5. **Teacher Override**: Allow teachers to manually adjust paths
6. **Advanced Diagnostics**: More comprehensive skill assessment
7. **Content Recommendations**: AI-suggested supplementary materials
8. **Progress Prediction**: Estimate time to reach target level

## Implementation Notes

- Path data stored in memory (consider MongoDB collection for persistence)
- Theta updates after each question response
- IRT parameters require calibration with real student data
- Module difficulty should be validated through field testing
- Consider A/B testing different path algorithms

## References

- [Learning Path Documentation](../docs/learning-path.md)
- Item Response Theory (IRT) 2PL Model
- Zone of Proximal Development (Vygotsky)
- Spaced Repetition Systems (SRS)
