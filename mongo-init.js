// MongoDB initialization for the application database.
// - docker-compose runs this automatically on first start (/docker-entrypoint-initdb.d)
// - manually: mongosh "mongodb://127.0.0.1:27017/english" mongo-init.js
//
// The schema mirrors server/src/models (Mongoose). Mongoose also creates these indexes on startup;
// the definitions here are identical so they never conflict.

const numberTypes = ['double', 'int', 'long', 'decimal'];

const questionsValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['text', 'answer', 'skill'],
    properties: {
      text: { bsonType: 'string', minLength: 1 },
      answer: { bsonType: 'string' },
      skill: { enum: ['reading', 'writing', 'listening', 'speaking'] },
      type: { bsonType: 'string' },
      difficulty: { bsonType: numberTypes },
      discrimination: { bsonType: numberTypes },
      options: { bsonType: 'array', items: { bsonType: 'string' } },
      audioUrl: { bsonType: 'string' },
      audioText: { bsonType: 'string' },
      explanation: { bsonType: 'string' }
    }
  }
};

function ensureCollection(name, options = {}) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name, options);
  } else if (Object.keys(options).length) {
    db.runCommand({ collMod: name, ...options });
  }
}

ensureCollection('questions', { validator: questionsValidator, validationLevel: 'moderate' });

db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ googleId: 1 }, { unique: true, sparse: true });
db.users.createIndex({ email: 1 }, { sparse: true });
db.users.createIndex({ role: 1 });
db.responses.createIndex({ user: 1, question: 1, timestamp: -1 });
db.responses.createIndex({ reviewStatus: 1, createdAt: 1 });
db.modules.createIndex({ skill: 1, level: 1 });
db.notifications.createIndex({ user: 1, read: 1, createdAt: -1 });
db.supporttickets.createIndex({ ticketNumber: 1 }, { unique: true });

print('✓ Database initialized');
