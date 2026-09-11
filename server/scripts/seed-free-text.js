import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import QuestionModel from '../src/models/question.js';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function seedFreeTextQuestions() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'english' });
    console.log('✓ Connected to MongoDB');

    // Clear existing free-text and listening questions (optional - set to false to keep)
    const clearExisting = false;
    if (clearExisting) {
      await QuestionModel.deleteMany({ type: { $in: ['free-text', 'fill-in-blank'] } });
      console.log('✓ Cleared existing free-text questions');
    }

    // ============================================================
    // FREE-TEXT QUESTIONS (Fill-in-the-blank, short answer)
    // ============================================================
    const freeTextQuestions = [
      {
        text: 'Complete the sentence: "I have been studying English _____ three years."',
        answer: 'for',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 1,
        explanation: 'Use "for" with a duration of time. "I have been studying for three years."'
      },
      {
        text: 'What does the word "serendipity" mean?',
        answer: 'finding something good by chance or luck',
        type: 'free-text',
        skill: 'reading',
        difficulty: 2,
        explanation: 'Serendipity means the occurrence of events by chance in a happy or beneficial way.'
      },
      {
        text: 'Fill in the blank: "She _____ to the store yesterday."',
        answer: 'went',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 0,
        explanation: 'Use simple past tense "went" for completed actions. "She went to the store yesterday."'
      },
      {
        text: 'Write a sentence using the word "although".',
        answer: 'Although it was raining, we went for a walk. / Although she was tired, she finished the project.',
        type: 'free-text',
        skill: 'writing',
        difficulty: 1,
        explanation: '"Although" is a conjunction used to show contrast. Example: "Although it was raining, we went for a walk."'
      },
      {
        text: 'Complete: "If I _____ rich, I would travel around the world."',
        answer: 'were',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 2,
        explanation: 'Use "were" for hypothetical situations in conditional sentences. "If I were rich, I would travel."'
      },
      {
        text: 'What is a synonym for "happy"?',
        answer: 'joyful / delighted / cheerful / glad / content',
        type: 'free-text',
        skill: 'reading',
        difficulty: 0,
        explanation: 'Synonyms for "happy" include: joyful, delighted, cheerful, glad, content, pleased.'
      },
      {
        text: 'Fill in the blank: "They have _____ lived in London for five years."',
        answer: 'always',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 1,
        explanation: 'Adverbs like "always" are placed after "have" in present perfect continuous. "They have always lived in London."'
      },
      {
        text: 'What is the opposite of "begin"?',
        answer: 'end / finish / conclude',
        type: 'free-text',
        skill: 'reading',
        difficulty: 0,
        explanation: 'The opposite (antonym) of "begin" is "end", "finish", or "conclude".'
      },
      {
        text: 'Complete: "The book is _____ interesting than the movie."',
        answer: 'more',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 1,
        explanation: 'Use "more" + adjective for comparative form. "The book is more interesting than the movie."'
      },
      {
        text: 'How do you pronounce the word "entrepreneur"?',
        answer: 'on-truh-pur-NUR / on-truh-puh-NER',
        type: 'free-text',
        skill: 'reading',
        difficulty: 1,
        explanation: 'The word "entrepreneur" is pronounced: on-truh-pur-NUR (stress on the last syllable).'
      },
      {
        text: 'Fill in the blank: "I wish I _____ speak Spanish fluently."',
        answer: 'could',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 2,
        explanation: 'After "wish", use past tense or modal verbs. "I wish I could speak Spanish fluently."'
      },
      {
        text: 'What does "procrastination" mean?',
        answer: 'delaying or postponing something / putting off tasks',
        type: 'free-text',
        skill: 'reading',
        difficulty: 1,
        explanation: 'Procrastination means delaying or postponing tasks, especially ones that need to be done.'
      },
      {
        text: 'Complete: "Neither he _____ she wants to attend the party."',
        answer: 'nor',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 1,
        explanation: 'Use "nor" in the pattern "neither...nor". "Neither he nor she wants to attend."'
      },
      {
        text: 'Describe a time when you felt proud. (2-3 sentences)',
        answer: 'Any personal description of a proud moment with proper grammar and tenses.',
        type: 'free-text',
        skill: 'writing',
        difficulty: 2,
        explanation: 'This is an open-ended question. Look for: past tense usage, clear descriptions, proper sentence structure.'
      },
      {
        text: 'Fill in the blank: "He has worked here _____ 2015."',
        answer: 'since',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 1,
        explanation: 'Use "since" with a specific point in time. "He has worked here since 2015."'
      },
      {
        text: 'What is the British English spelling of "color"?',
        answer: 'colour',
        type: 'free-text',
        skill: 'writing',
        difficulty: 0,
        explanation: 'British English uses "colour" while American English uses "color".'
      },
      {
        text: 'Complete: "If you study hard, you _____ pass the exam."',
        answer: 'will',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 1,
        explanation: 'In first conditional, use "will" for future result. "If you study hard, you will pass."'
      },
      {
        text: 'Explain the difference between "affect" and "effect".',
        answer: '"Affect" is a verb meaning to influence. "Effect" is a noun meaning a result or consequence.',
        type: 'free-text',
        skill: 'writing',
        difficulty: 2,
        explanation: 'Affect = verb (to influence/change); Effect = noun (result/outcome). "The weather affects my mood. It has a positive effect."'
      },
      {
        text: 'Fill in the blank: "Despite _____ tired, she continued working."',
        answer: 'being',
        type: 'fill-in-blank',
        skill: 'writing',
        difficulty: 2,
        explanation: 'Use gerund (-ing form) after prepositions. "Despite being tired, she continued."'
      },
      {
        text: 'What makes a good leader?',
        answer: 'Any response mentioning qualities like: integrity, communication, vision, empathy, decisiveness',
        type: 'free-text',
        skill: 'writing',
        difficulty: 2,
        explanation: 'Look for: clear qualities, explanation, relevant examples, proper sentence structure.'
      }
    ];

    const insertedFreeText = await QuestionModel.insertMany(freeTextQuestions);
    console.log(`✓ Seeded ${insertedFreeText.length} free-text questions`);

    // ============================================================
    // LISTENING QUESTIONS WITH AUDIO METADATA
    // ============================================================
    const listeningQuestionsWithAudio = [
      {
        text: 'What does the speaker say about the weather?',
        answer: 'It will be sunny tomorrow',
        type: 'objective',
        skill: 'listening',
        difficulty: 1,
        options: ['It will be rainy', 'It will be sunny tomorrow', 'It will be cloudy', 'It will be cold'],
        audioText: 'Good evening. This is the weather report. Tomorrow will be a beautiful sunny day with temperatures around 75 degrees Fahrenheit.',
        explanation: 'The speaker explicitly states "Tomorrow will be a beautiful sunny day".'
      },
      {
        text: 'According to the conversation, where is the restaurant located?',
        answer: 'Next to the library',
        type: 'objective',
        skill: 'listening',
        difficulty: 1,
        options: ['Next to the library', 'Downtown', 'Near the park', 'On Main Street'],
        audioText: 'Person A: "Where is that new Italian restaurant?" Person B: "It\'s located next to the library, on Oak Street."',
        explanation: 'Person B clearly states the restaurant is next to the library.'
      },
      {
        text: 'How many people are attending the meeting?',
        answer: '12 people',
        type: 'objective',
        skill: 'listening',
        difficulty: 1,
        options: ['8 people', '10 people', '12 people', '15 people'],
        audioText: 'The manager announced that 12 people from different departments will be attending the meeting tomorrow.',
        explanation: 'The audio states exactly "12 people" will attend.'
      },
      {
        text: 'What is the main topic of the lecture?',
        answer: 'Climate change and its effects on biodiversity',
        type: 'objective',
        skill: 'listening',
        difficulty: 2,
        options: ['Renewable energy sources', 'Climate change and its effects on biodiversity', 'Ocean pollution', 'Global warming solutions'],
        audioText: 'Today\'s lecture will focus on how climate change impacts various species and their habitats, with particular attention to biodiversity loss.',
        explanation: 'The lecturer introduces the main topic as climate change and biodiversity effects.'
      },
      {
        text: 'When does the speaker recommend visiting the museum?',
        answer: 'In the morning',
        type: 'objective',
        skill: 'listening',
        difficulty: 1,
        options: ['In the afternoon', 'In the evening', 'In the morning', 'Late at night'],
        audioText: 'I recommend visiting the museum in the morning because it\'s usually less crowded and you can take your time to enjoy the exhibits.',
        explanation: 'The speaker explicitly recommends visiting in the morning.'
      }
    ];

    const insertedListening = await QuestionModel.insertMany(listeningQuestionsWithAudio);
    console.log(`✓ Seeded ${insertedListening.length} listening questions with audio metadata`);

    console.log('✅ Seeding complete!');
    console.log(`Total: ${insertedFreeText.length + insertedListening.length} questions added`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seedFreeTextQuestions();
