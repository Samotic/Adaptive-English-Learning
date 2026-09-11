# ML Ops Automated Retraining System
## UC18: Retrain/Update AI Models

This system provides automated machine learning model retraining capabilities using production training data collected from user interactions.

---

## 🎯 Overview

The ML Ops system consists of:

1. **TrainingData Collection** (Phase 3) - Collects anonymized user interaction data
2. **ModelVersion Schema** - Tracks different model versions with parameters and metrics
3. **Retraining Service** - Automated learning algorithm that updates model parameters
4. **Background Script** - Can be run manually or scheduled via cron
5. **API Endpoints** - Admin interface for triggering and monitoring retraining

---

## 📊 How It Works

### 1. Data Collection
User interactions (quiz answers, clicks, page views) are collected in the `TrainingData` collection:
- Anonymized user ID (hashed)
- Question ID, difficulty, module
- Answer correctness
- Response time
- Timestamp

### 2. Learning Algorithm
The system uses an **Item Response Theory (IRT)** based approach:

**For Questions:**
- Calculates success rate for each question
- Adjusts difficulty if too easy (>80% correct) or too hard (<30% correct)
- Uses formula: `adjustment = (0.5 - successRate) * 0.4`

**For Users:**
- Estimates ability (theta) based on overall success rate
- Maps performance to ability scale:
  - 90%+ correct → theta ≥ 2.0
  - 70-89% → theta 1.0-2.0
  - 50-69% → theta 0.0-1.0
  - <50% → theta < 0.0

**Prediction:**
Uses IRT formula: `P(correct) = 1 / (1 + exp(-(theta - difficulty)))`

### 3. Model Versioning
Each training run creates a new model version with:
- Unique version number (v1, v2, v3...)
- Training metadata (data count, duration)
- Model parameters (difficulty, discrimination, ability estimates)
- Performance metrics (accuracy, RMSE, MAE, F1 score)
- Deployment status (training, completed, deployed, archived)

### 4. Auto-Deployment
If the new model achieves >75% accuracy, it's automatically deployed to production:
- Previous production model is archived
- New model is marked as production
- Deployment timestamp is recorded

---

## 🚀 Usage

### Manual Run (Background Script)

```bash
cd server
node scripts/retrain.js
```

**Output:**
```
============================================================
🤖 ML OPS: AUTOMATED MODEL RETRAINING
============================================================

📡 Connecting to MongoDB...
✅ Connected to database

📦 Current production model: v1
   Accuracy: 82.45%
   Deployed: 2024-01-15T10:30:00.000Z

[Retraining] 🚀 Starting automated model retraining...
[Retraining] 📊 Loaded 1234 training samples
[Retraining] 📦 Created model version: v2
[Learning] 🧠 Running IRT-based learning algorithm...
[Learning] 📊 Processed 54 questions and 89 users
[Learning] 📈 Difficulty mean: 0.52
[Learning] 📈 Ability mean: 0.34
[Retraining] 🧮 Learning algorithm completed
[Evaluation] 🔍 Evaluating model performance...
[Evaluation] ✅ Accuracy: 84.23%
[Evaluation] 📊 RMSE: 0.3245
[Retraining] 📈 Model evaluation completed
[Retraining] ✅ Model version v2 saved successfully
[Deploy] 🚀 Deploying model to production...
[Deploy] 📝 Model parameters ready for application
[Retraining] 🚀 Model deployed to production

============================================================
✅ RETRAINING COMPLETED SUCCESSFULLY

📊 Results:
   Version: v2
   Training samples: 1234
   Duration: 2.45s

📈 Performance Metrics:
   Accuracy: 84.23%
   Precision: 84.23%
   Recall: 84.23%
   F1 Score: 84.23%
   RMSE: 0.3245
   MAE: 0.2156

🚀 Model deployed to production!
============================================================

👋 Database connection closed
```

### API Endpoints (Admin Only)

All ML Ops endpoints require admin authentication.

#### 1. Trigger Retraining
```http
POST /api/mlops/retrain
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "limit": 10000,        // Max training samples (default: 10000)
  "autoDeploy": true,    // Auto-deploy if accuracy > 75% (default: true)
  "since": "2024-01-01"  // Only use data since this date (optional)
}
```

**Response:**
```json
{
  "success": true,
  "version": "v2",
  "metrics": {
    "accuracy": 0.8423,
    "precision": 0.8423,
    "recall": 0.8423,
    "f1Score": 0.8423,
    "rmse": 0.3245,
    "mae": 0.2156
  },
  "trainingDataCount": 1234,
  "duration": 2.45
}
```

#### 2. Get Retraining Status
```http
GET /api/mlops/status
```

**Response:**
```json
{
  "isTraining": false,
  "currentVersion": "v2"
}
```

#### 3. List All Model Versions
```http
GET /api/mlops/versions
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "versions": [
    {
      "_id": "...",
      "version": "v2",
      "modelType": "irt",
      "status": "deployed",
      "isProduction": true,
      "metrics": { "accuracy": 0.8423, ... },
      "trainingDataCount": 1234,
      "deployedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "...",
      "version": "v1",
      "modelType": "irt",
      "status": "archived",
      "isProduction": false,
      "metrics": { "accuracy": 0.8245, ... },
      "trainingDataCount": 987
    }
  ]
}
```

#### 4. Get Current Production Model
```http
GET /api/mlops/production
```

**Response:**
```json
{
  "model": {
    "version": "v2",
    "modelType": "irt",
    "status": "deployed",
    "isProduction": true,
    "metrics": { "accuracy": 0.8423, ... },
    "parameters": {
      "difficulty": { "mean": 0.52, "variance": 0.15 },
      "abilityEstimates": { "mean": 0.34, "variance": 0.22 }
    },
    "deployedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 5. Deploy Specific Version
```http
POST /api/mlops/deploy/:versionId
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "version": "v2",
  "deployedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 6. Get Version Details
```http
GET /api/mlops/versions/:versionId
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "version": {
    "_id": "...",
    "version": "v2",
    "modelType": "irt",
    "status": "deployed",
    "parameters": { ... },
    "metrics": { ... },
    "config": {
      "batchSize": 32,
      "validationSplit": 0.2,
      "randomSeed": 42
    },
    "trainingStartedAt": "2024-01-15T10:29:45.000Z",
    "trainingCompletedAt": "2024-01-15T10:29:47.450Z"
  }
}
```

---

## 📅 Scheduling (Cron Job)

To run retraining automatically (e.g., daily at 2 AM):

### Linux/Mac (crontab)
```bash
crontab -e
```

Add line:
```
0 2 * * * cd /path/to/english/server && node scripts/retrain.js >> logs/retrain.log 2>&1
```

### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `scripts/retrain.js`
   - Start in: `D:\projects\english\server`

### PM2 (Recommended for Production)
```bash
# Install PM2
npm install -g pm2

# Create cron job with PM2
pm2 install pm2-cron
pm2 start scripts/retrain.js --cron "0 2 * * *" --name ml-retrain --no-autorestart
```

---

## 🔧 Configuration

### Environment Variables
```env
MONGODB_URI=mongodb+srv://...  # Database connection
JWT_SECRET=your-secret         # For admin authentication
```

### Retraining Options
Edit [retrainingService.js](../src/services/retrainingService.js):

```javascript
// Adjust learning parameters
learningRate: 0.01,           // How quickly to update parameters
convergenceThreshold: 0.001,  // When to stop iterating
```

```javascript
// Change auto-deployment threshold
if (metrics.accuracy > 0.75 && options.autoDeploy !== false) {
  // Change 0.75 to your preferred threshold
}
```

---

## 📈 Model Performance Metrics

### Accuracy
Percentage of correct predictions (threshold at 0.5 probability)

### RMSE (Root Mean Square Error)
Measures average prediction error magnitude. Lower is better.

### MAE (Mean Absolute Error)
Average absolute difference between predicted and actual. Lower is better.

### F1 Score
Harmonic mean of precision and recall. Balanced measure of performance.

---

## 🎓 Model Parameters

### Difficulty (b)
- Range: typically -3 to +3
- Mean ~0.5 indicates moderate difficulty
- Higher values = harder questions

### Discrimination (a)
- Range: typically 0 to 3
- Mean ~1.0 indicates good discrimination
- Higher values = better differentiation between abilities

### Ability/Theta (θ)
- Range: typically -3 to +3
- Mean ~0 indicates average ability
- Higher values = higher student ability

---

## 🔒 Security

- All ML Ops endpoints require admin authentication
- Training data is anonymized (hashed user IDs)
- Model parameters are stored securely in MongoDB
- Only admins can trigger retraining or deploy models

---

## 🐛 Troubleshooting

### "No training data available"
- Ensure users have completed quizzes
- Check TrainingData collection: `db.trainingdatas.count()`
- Training data collection happens on quiz submission

### "Training already in progress"
- Wait for current training to complete
- Check status: `GET /api/mlops/status`
- Or restart the server to reset

### Low accuracy (<50%)
- Need more training data (collect >500 samples)
- Check question quality and difficulty distribution
- Verify answer keys are correct

### Model not deploying
- Check if accuracy > 75% threshold
- Set `autoDeploy: true` in request
- Or manually deploy: `POST /api/mlops/deploy/:versionId`

---

## 📚 Files

- **Model:** [server/src/models/modelVersion.js](../src/models/modelVersion.js)
- **Service:** [server/src/services/retrainingService.js](../src/services/retrainingService.js)
- **Script:** [server/scripts/retrain.js](../scripts/retrain.js)
- **API:** [server/src/index.js](../src/index.js) (lines 1123-1280)
- **Training Data Model:** [server/src/models/trainingData.js](../src/models/trainingData.js)

---

## ✅ UC18 Compliance

This implementation satisfies **UC18: Retrain/Update AI Models** requirements:

✅ **Automated retraining:** Background script reads TrainingData and updates model  
✅ **Learning function:** IRT-based algorithm adjusts difficulty and ability estimates  
✅ **Model versioning:** Each training run creates versioned model with metadata  
✅ **Production deployment:** Auto-deployment based on performance threshold  
✅ **ML Ops pipeline:** Complete workflow from data collection → training → deployment  
✅ **Monitoring:** API endpoints for status, versions, and performance metrics  

---

*Last Updated: January 2024*
