import React, { useState } from 'react';
import { generateInitialPath } from '../api';
import { BookOpen, Sparkles, Target, TrendingUp } from 'lucide-react';

export default function InitialPathGenerator({ token, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [externalScores, setExternalScores] = useState({
    reading: 50,
    writing: 50,
    listening: 50,
    speaking: 50
  });
  const [hasExternalScores, setHasExternalScores] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState(['reading', 'writing', 'listening', 'speaking']);

  const handleScoreChange = (skill, value) => {
    setExternalScores(prev => ({ ...prev, [skill]: parseInt(value) || 0 }));
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const options = {
        targetSkills: selectedSkills,
        externalScores: hasExternalScores ? externalScores : null
      };
      
      const path = await generateInitialPath(token, options);
      onComplete(path);
    } catch (e) {
      console.error('Failed to generate path:', e);
      alert('Failed to generate learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          marginBottom: '20px'
        }}>
          <Sparkles size={40} color="white" />
        </div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px'
        }}>
          Let's Create Your Learning Path
        </h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          We'll personalize your experience based on your current level and goals
        </p>
      </div>

      {/* Progress Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '40px'
      }}>
        {[1, 2, 3].map(num => (
          <div key={num} style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: step >= num ? '#667eea' : '#e0e0e0',
            transition: 'all 0.3s ease'
          }} />
        ))}
      </div>

      {/* Step 1: Welcome & Intro */}
      {step === 1 && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ marginBottom: '24px', color: '#1a1a1a' }}>
            Welcome to Adaptive AI Learn! 🎓
          </h2>
          <p style={{ color: '#666', lineHeight: '1.8', marginBottom: '24px' }}>
            Our AI-powered platform creates a personalized learning journey just for you. 
            We use adaptive algorithms to match content to your skill level and adjust 
            as you progress.
          </p>
          
          <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
            {[
              { icon: Target, title: 'Personalized Path', desc: 'Content matched to your level' },
              { icon: TrendingUp, title: 'Adaptive Learning', desc: 'Difficulty adjusts with progress' },
              { icon: BookOpen, title: 'Four Skills', desc: 'Reading, Writing, Listening, Speaking' }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Get Started →
          </button>
        </div>
      )}

      {/* Step 2: Skill Selection & Diagnostic */}
      {step === 2 && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ marginBottom: '12px', color: '#1a1a1a' }}>
            Which skills would you like to improve?
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Select all that apply. We'll create a balanced learning path.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            {[
              { skill: 'reading', label: 'Reading', emoji: '📖' },
              { skill: 'writing', label: 'Writing', emoji: '✍️' },
              { skill: 'listening', label: 'Listening', emoji: '👂' },
              { skill: 'speaking', label: 'Speaking', emoji: '🗣️' }
            ].map(({ skill, label, emoji }) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                style={{
                  padding: '20px',
                  background: selectedSkills.includes(skill) 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#f9fafb',
                  color: selectedSkills.includes(skill) ? 'white' : '#1a1a1a',
                  border: selectedSkills.includes(skill) ? 'none' : '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{emoji}</span>
                {label}
              </button>
            ))}
          </div>

          <div style={{
            padding: '20px',
            background: '#f0f4ff',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              color: '#1a1a1a',
              fontWeight: '500'
            }}>
              <input
                type="checkbox"
                checked={hasExternalScores}
                onChange={(e) => setHasExternalScores(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              I have previous test scores to help calibrate my starting level
            </label>
          </div>

          {hasExternalScores && (
            <div style={{
              padding: '24px',
              background: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', color: '#1a1a1a' }}>
                Enter your scores (0-100)
              </h3>
              {['reading', 'writing', 'listening', 'speaking'].map(skill => (
                <div key={skill} style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#666',
                    textTransform: 'capitalize'
                  }}>
                    {skill}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={externalScores[skill]}
                    onChange={(e) => handleScoreChange(skill, e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#999' }}>Beginner</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#667eea' }}>
                      {externalScores[skill]}
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>Advanced</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                padding: '16px',
                background: '#f9fafb',
                color: '#666',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedSkills.length === 0}
              style={{
                flex: 2,
                padding: '16px',
                background: selectedSkills.length > 0 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e0e0e0',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: selectedSkills.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (selectedSkills.length > 0) e.target.style.transform = 'scale(1.02)';
              }}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation & Generate */}
      {step === 3 && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ marginBottom: '12px', color: '#1a1a1a' }}>
            Ready to create your path! 🚀
          </h2>
          <p style={{ color: '#666', marginBottom: '32px' }}>
            We'll generate a personalized learning journey based on your selections.
          </p>

          <div style={{
            padding: '24px',
            background: '#f9fafb',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#999', marginBottom: '12px' }}>
              YOUR SELECTIONS
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#1a1a1a' }}>Focus Skills:</strong>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedSkills.map(skill => (
                  <span key={skill} style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            {hasExternalScores && (
              <div>
                <strong style={{ color: '#1a1a1a' }}>Diagnostic Scores:</strong>
                <div style={{
                  marginTop: '8px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  {Object.entries(externalScores).map(([skill, score]) => (
                    <div key={skill} style={{
                      padding: '8px 12px',
                      background: 'white',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}>
                      <span style={{ textTransform: 'capitalize', color: '#666' }}>{skill}:</span>
                      <strong style={{ marginLeft: '8px', color: '#667eea' }}>{score}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '16px',
                background: '#f9fafb',
                color: '#666',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                flex: 2,
                padding: '16px',
                background: loading 
                  ? '#e0e0e0'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!loading) e.target.style.transform = 'scale(1.02)';
              }}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              {loading ? 'Generating Your Path...' : 'Generate My Learning Path ✨'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
