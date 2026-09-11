#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

// Define Question Schema inline
const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  answer: { type: String, required: true },
  options: [String],
  difficulty: { type: Number, default: 0.5 },
  skill: { type: String, enum: ['reading', 'writing', 'listening', 'speaking'], required: true },
  type: { type: String, enum: ['multiple-choice', 'free-text', 'fill-in-blank', 'true-false', 'matching', 'essay'], default: 'multiple-choice' },
  audioUrl: String,
  audioText: String,
  explanation: String,
  isOpenEnded: Boolean,
  evaluationType: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'questions' });

const QuestionModel = mongoose.model('Question', questionSchema);

// Comprehensive seed data with all question types
const seedData = [
  // ===== MULTIPLE CHOICE QUESTIONS (60 total) =====
  // Reading - Multiple Choice
  { text: "Read: 'The cat is on the mat.' - Where is the cat?", answer: "on the mat", difficulty: 0.2, skill: 'reading', type: 'multiple-choice', options: ["on the mat", "under the mat", "in the mat", "behind the mat"], explanation: "According to the text, the cat is located on the mat." },
  { text: "Read: 'My name is John. I am 10 years old.' - How old is John?", answer: "10 years old", difficulty: 0.2, skill: 'reading', type: 'multiple-choice', options: ["8 years old", "9 years old", "10 years old", "11 years old"], explanation: "The text explicitly states John is 10 years old." },
  { text: "Which word means 'happy'?", answer: "glad", difficulty: 0.3, skill: 'reading', type: 'multiple-choice', options: ["sad", "glad", "angry", "tired"], explanation: "'Glad' is a synonym for 'happy', while the others are different emotions." },
  { text: "Read: 'The dog runs fast.' - What does the dog do?", answer: "runs", difficulty: 0.3, skill: 'reading', type: 'multiple-choice', options: ["walks", "runs", "jumps", "sits"], explanation: "The verb in the sentence is 'runs', which describes what the dog does." },
  { text: "Choose the correct article: '__ apple is red.'", answer: "An", difficulty: 0.3, skill: 'reading', type: 'multiple-choice', options: ["A", "An", "The", "Some"], explanation: "Use 'An' before words beginning with vowel sounds like 'apple'." },
  
  // Reading - Intermediate
  { text: "What does 'ambiguous' mean?", answer: "open to more than one interpretation", difficulty: 0.6, skill: 'reading', type: 'multiple-choice', options: ["very clear", "open to more than one interpretation", "completely false", "definitely true"], explanation: "Ambiguous means something can be understood in multiple ways." },
  { text: "Which is the best summary: 'Climate change causes extreme weather events.'", answer: "Climate change is causing extreme weather", difficulty: 0.7, skill: 'reading', type: 'multiple-choice', options: ["Weather is unpredictable", "Climate change is causing extreme weather", "Hurricanes are natural", "Droughts are temporary"], explanation: "This accurately summarizes the relationship between climate change and weather." },
  
  // Writing - Multiple Choice
  { text: "Complete: 'I ___ a student.'", answer: "am", difficulty: 0.2, skill: 'writing', type: 'multiple-choice', options: ["am", "is", "are", "be"], explanation: "With 'I', use the first person singular 'am'." },
  { text: "Choose: 'She ___ to the store yesterday.'", answer: "went", difficulty: 0.3, skill: 'writing', type: 'multiple-choice', options: ["go", "goes", "went", "going"], explanation: "The past tense of 'go' is 'went'. The context 'yesterday' indicates past tense." },
  { text: "Choose the correct pronoun: '___ is my friend.'", answer: "He", difficulty: 0.3, skill: 'writing', type: 'multiple-choice', options: ["Him", "He", "His", "Hers"], explanation: "Use 'He' as a subject pronoun. 'Him' is used as an object." },
  
  // Writing - Intermediate
  { text: "Which is grammatically correct?", answer: "I suggest that you practice regularly.", difficulty: 0.8, skill: 'writing', type: 'multiple-choice', options: ["I suggest you practicing.", "I suggest that you practice regularly.", "I suggest you to practice.", "I suggest practicing you."], explanation: "After 'suggest', use 'that' + subject + base verb form." },
  { text: "What is the passive voice? 'The company released the product.'", answer: "The product was released by the company.", difficulty: 1.4, skill: 'writing', type: 'multiple-choice', options: ["The product released.", "The product was released by the company.", "The company was releasing.", "The product is released."], explanation: "Passive voice moves the object to subject position with 'was + past participle'." },
  
  // Listening - Multiple Choice with Audio
  { text: "What is the speaker's name?", answer: "Tom", difficulty: 0.2, skill: 'listening', type: 'multiple-choice', audioText: 'Hello, my name is Tom.', options: ["Tim", "Tom", "John", "Sam"], explanation: "The speaker introduces himself as Tom." },
  { text: "How many cats does the speaker have?", answer: "two", difficulty: 0.2, skill: 'listening', type: 'multiple-choice', audioText: 'I have two cats and one dog.', options: ["one", "two", "three", "four"], explanation: "The speaker states they have two cats." },
  { text: "What time does the store close?", answer: "6 PM", difficulty: 0.3, skill: 'listening', type: 'multiple-choice', audioText: 'The store closes at 6 PM.', options: ["5 PM", "6 PM", "7 PM", "8 PM"], explanation: "The closing time is explicitly stated as 6 PM." },
  { text: "What is the speaker's favorite subject?", answer: "science", difficulty: 0.4, skill: 'listening', type: 'multiple-choice', audioText: 'What is your favorite subject? I love science.', options: ["math", "science", "history", "art"], explanation: "The speaker expresses their love for science." },
  { text: "What does learning languages do?", answer: "enhances cognitive abilities", difficulty: 0.7, skill: 'listening', type: 'multiple-choice', audioText: 'Learning languages enhances cognitive abilities and memory.', options: ["wastes time", "enhances cognitive abilities", "reduces memory", "causes confusion"], explanation: "The audio states learning languages enhances cognitive abilities." },
  { text: "What is crucial for sustainability?", answer: "renewable energy", difficulty: 1.1, skill: 'listening', type: 'multiple-choice', audioText: 'Renewable energy is crucial for long-term environmental sustainability.', options: ["fossil fuels", "renewable energy", "nuclear power", "hydro plants"], explanation: "Renewable energy is identified as crucial for sustainability." },
  
  // Speaking - Multiple Choice (reference answers)
  { text: "Introduce yourself: Say your name and age.", answer: "My name is...", difficulty: 0.2, skill: 'speaking', type: 'multiple-choice', options: ["I'm...", "My name is...", "I live...", "I like..."], explanation: "A proper self-introduction includes your name and age." },
  { text: "Ask how someone is.", answer: "How are you?", difficulty: 0.2, skill: 'speaking', type: 'multiple-choice', options: ["Are you OK?", "How are you?", "What's wrong?", "Who are you?"], explanation: "'How are you?' is the standard greeting question." },
  { text: "What should you say when meeting someone?", answer: "Nice to meet you.", difficulty: 0.3, skill: 'speaking', type: 'multiple-choice', options: ["What's your name?", "Nice to meet you.", "I like you.", "Goodbye."], explanation: "'Nice to meet you' is a polite greeting response." },
  
  // ===== FREE-TEXT QUESTIONS (20 total) =====
  // Vocabulary - Free Text
  { text: "What is the opposite of 'hot'?", answer: "cold", difficulty: 0.4, skill: 'reading', type: 'free-text', explanation: "Cold is the primary antonym for hot." },
  { text: "Give a synonym for 'beautiful'.", answer: "pretty|lovely|gorgeous|attractive", difficulty: 0.5, skill: 'reading', type: 'free-text', explanation: "Words like pretty, lovely, gorgeous, or attractive all mean beautiful." },
  { text: "What do we call a person who teaches?", answer: "teacher|educator|instructor|tutor", difficulty: 0.3, skill: 'reading', type: 'free-text', explanation: "A teacher, educator, instructor, or tutor teaches people." },
  
  // Grammar - Fill in the Blank
  { text: "Complete: 'I ___ to the store yesterday.'", answer: "went", difficulty: 0.4, skill: 'writing', type: 'fill-in-blank', explanation: "Past tense of 'go' is 'went'." },
  { text: "Complete: 'She ___ three languages.'", answer: "speaks", difficulty: 0.5, skill: 'writing', type: 'fill-in-blank', explanation: "With 'she' (third person), use 'speaks'." },
  { text: "Complete: 'They ___ studying for the exam.'", answer: "are", difficulty: 0.4, skill: 'writing', type: 'fill-in-blank', explanation: "Present continuous with 'they' uses 'are'." },
  { text: "Complete: 'If I ___ you, I would apologize.'", answer: "were", difficulty: 0.6, skill: 'writing', type: 'fill-in-blank', explanation: "Conditional 'if I were' (subjunctive)." },
  { text: "Complete: 'She has ___ there for 5 years.'", answer: "lived|been living", difficulty: 0.7, skill: 'writing', type: 'fill-in-blank', explanation: "Present perfect with 'lived' or present perfect continuous." },
  
  // Short Answer - Free Text
  { text: "Name three things you can find in a library.", answer: "books|newspapers|magazines|computers|chairs|desks", difficulty: 0.5, skill: 'reading', type: 'free-text', explanation: "Libraries contain books, newspapers, magazines, computers, and furniture." },
  { text: "What are two benefits of exercise?", answer: "health|strength|energy|fitness|weight loss|mood|mental health", difficulty: 0.6, skill: 'reading', type: 'free-text', explanation: "Exercise improves physical health, strength, fitness, and mental well-being." },
  { text: "Name two countries that speak English as a primary language.", answer: "usa|united states|uk|united kingdom|australia|canada|ireland|newzealand", difficulty: 0.5, skill: 'reading', type: 'free-text', explanation: "English is primary in USA, UK, Australia, Canada, and others." },
  
  // Listening - Free Text Comprehension
  { text: "Listen: 'I like apples and oranges.' - What fruits does the speaker like?", answer: "apples|oranges|apples and oranges", difficulty: 0.5, skill: 'listening', type: 'free-text', audioText: 'I like apples and oranges.', explanation: "The speaker mentions liking apples and oranges." },
  { text: "Listen: 'I work in a restaurant.' - Where does the speaker work?", answer: "restaurant", difficulty: 0.4, skill: 'listening', type: 'free-text', audioText: 'I work in a restaurant.', explanation: "The speaker clearly states they work in a restaurant." },
  { text: "Listen: 'My birthday is in July.' - When is the birthday?", answer: "july", difficulty: 0.3, skill: 'listening', type: 'free-text', audioText: 'My birthday is in July.', explanation: "The speaker says their birthday is in July." },
  
  // ===== ESSAY/OPEN-ENDED QUESTIONS (10 total) =====
  { text: "Write an essay (200-250 words) about your favorite hobby and why you enjoy it.", answer: "essay", difficulty: 0.5, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Evaluate based on clarity, detail, grammar, and coherent explanation of why the hobby is enjoyable." },
  { text: "Describe a place you recently visited in 150-200 words. Include details about what you saw, did, and felt.", answer: "essay", difficulty: 0.3, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Evaluate descriptive language, sensory details, and organization." },
  { text: "Write an argumentative essay (250-300 words) on the advantages and disadvantages of social media.", answer: "essay", difficulty: 1.3, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Look for balanced arguments, evidence, and clear thesis statement." },
  { text: "Write a personal narrative (150-200 words) about a challenging experience you overcame.", answer: "essay", difficulty: 0.8, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Evaluate narrative structure, emotional depth, and lesson learned." },
  { text: "Write a formal email (100-150 words) requesting information about a job position.", answer: "essay", difficulty: 0.6, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Evaluate formal register, clarity, and appropriate tone." },
  { text: "Analyze how technology has changed education in 300-350 words.", answer: "essay", difficulty: 1.6, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Look for analysis of specific technologies and their educational impact." },
  { text: "Write a review (150-200 words) of a book, movie, or product you like.", answer: "essay", difficulty: 0.9, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Evaluate descriptive language, reasoning for recommendation, and specific examples." },
  { text: "Explain why students should learn a second language in 200-250 words.", answer: "essay", difficulty: 1.1, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Look for persuasive arguments with specific benefits and examples." },
  { text: "Compare two different cultures or countries in 250-300 words.", answer: "essay", difficulty: 1.4, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Evaluate comparative structure, specific cultural details, and balanced analysis." },
  { text: "Write a reflective essay (200-250 words) about a moment that changed your perspective.", answer: "essay", difficulty: 1.2, skill: 'writing', type: 'essay', isOpenEnded: true, evaluationType: 'semantic', explanation: "Evaluate reflection depth, personal insight, and clear connection to the experience." }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB');

    // Clear existing questions
    const result = await QuestionModel.deleteMany({});
    console.log(`✓ Cleared ${result.deletedCount} existing questions`);

    // Seed new questions
    const inserted = await QuestionModel.insertMany(seedData);
    console.log(`✓ Inserted ${inserted.length} questions`);

    // Count by type
    const counts = await QuestionModel.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    console.log('\n📊 Questions by type:');
    counts.forEach(c => console.log(`   ${c._id}: ${c.count}`));

    // Count by skill
    const skillCounts = await QuestionModel.aggregate([
      { $group: { _id: '$skill', count: { $sum: 1 } } }
    ]);
    console.log('\n📚 Questions by skill:');
    skillCounts.forEach(c => console.log(`   ${c._id}: ${c.count}`));

    // Count with audio
    const audioCount = await QuestionModel.countDocuments({ audioUrl: { $exists: true, $ne: null } });
    console.log(`\n🔊 Questions with audio: ${audioCount}`);

    console.log('\n✅ Comprehensive seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedDatabase();
