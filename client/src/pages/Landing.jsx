import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, BarChart2, Zap, Globe2, Trophy } from 'lucide-react';
// SVG illustrations (inline for demo)
const HeroSVG = () => (
  <svg width="240" height="80" viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom: 20}}>
    <text x="120" y="50" textAnchor="middle" fontSize="20" fill="white" fontFamily="Segoe UI" fontWeight="600">Learn English</text>
  </svg>
);

const FeatureSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="36" fill="#f9fafb" stroke="#667eea" strokeWidth="4" />
    <path d="M40 20v40M20 40h40" stroke="#667eea" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Student',
    feedback: 'This platform transformed my English learning. The adaptive questions are perfectly calibrated to my level!',
    avatar: '👩‍🎓'
  },
  {
    name: 'Miguel Rodriguez',
    role: 'Professional',
    feedback: 'I improved my business English significantly in just 3 months. Highly recommended for professionals!',
    avatar: '👨‍💼'
  },
  {
    name: 'Yuki Tanaka',
    role: 'Language Enthusiast',
    feedback: 'The spaced repetition system really works. I\'ve never retained vocabulary so well before!',
    avatar: '👩‍🏫'
  },
  {
    name: 'Ahmed Hassan',
    role: 'Teacher',
    feedback: 'I recommend this to all my students. The personalized learning path keeps them engaged.',
    avatar: '👨‍🏫'
  }
];

const features = [
  {
    icon: <Target color="#667eea" size={40} />, title: 'Adaptive Learning',
    description: 'Questions automatically adjust to match your skill level using IRT (Item Response Theory) algorithms.'
  },
  {
    icon: <BookOpen color="#667eea" size={40} />, title: 'Spaced Repetition',
    description: 'Scientifically-proven spacing algorithm ensures optimal retention of vocabulary and concepts.'
  },
  {
    icon: <BarChart2 color="#667eea" size={40} />, title: 'Progress Tracking',
    description: 'Monitor your improvement with our theta ability scoring system in real-time.'
  },
  {
    icon: <Zap color="#667eea" size={40} />, title: 'Fast & Efficient',
    description: 'Learn effectively with short, focused sessions that fit into your busy schedule.'
  },
  {
    icon: <Globe2 color="#667eea" size={40} />, title: 'Globally Curated Content',
    description: 'Practice with questions covering diverse topics and real-world English usage.'
  },
  {
    icon: <Trophy color="#667eea" size={40} />, title: 'Proven Results',
    description: 'Join thousands of learners who have achieved their English language goals.'
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const carouselSlides = [
    {
      title: 'Learn at Your Own Pace',
      subtitle: 'Adaptive questions that grow with you',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Master English Vocabulary',
      subtitle: 'Never forget what you\'ve learned',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Track Your Progress',
      subtitle: 'See measurable improvement every day',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  const nextTestimonial = () => setTestimonialIndex((i) => (i + 1) % testimonials.length);
  const prevTestimonial = () => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="landing-page">
      {/* Header & Navigation */}
      <header className="header">
        <div className="header-container">
          <div className="logo">📖 Adaptive English</div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#about">About</a>
          </nav>
          <button className="nav-cta" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </header>

      {/* Hero Carousel with SVG and photo */}
      <section className="hero-carousel">
        <div 
          className="carousel-slide"
          style={{ 
            background: carouselSlides[carouselIndex].gradient
          }}
        >
          {/* Gradient Background */}
          <div className="landing-carousel-bg" style={{
            background: carouselSlides[carouselIndex].gradient
          }}></div>

          <div className="carousel-content">
            <HeroSVG />
            <h1 className="landing-hero-title">{carouselSlides[carouselIndex].title}</h1>
            <p className="landing-hero-subtitle">{carouselSlides[carouselIndex].subtitle}</p>
            <button className="cta-button-large" onClick={() => navigate('/login')}>Start Learning Now</button>
          </div>

          <div className="carousel-indicator">
            {carouselSlides.map((_, i) => (
              <div 
                key={i}
                className={`indicator ${i === carouselIndex ? 'active' : ''}`}
                onClick={() => setCarouselIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with SVG icons */}
      <section id="features" className="features-section">
        <div className="section-container">
          <h2 className="section-title">Why Choose Adaptive English?</h2>
          <p className="section-subtitle">Leverage cutting-edge AI and learning science</p>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card-large">
                <div className="feature-icon" style={{marginBottom:8}}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat">
            <h3>10K+</h3>
            <p>Active Learners</p>
          </div>
          <div className="stat">
            <h3>5K+</h3>
            <p>Questions</p>
          </div>
          <div className="stat">
            <h3>87%</h3>
            <p>Success Rate</p>
          </div>
          <div className="stat">
            <h3>30+</h3>
            <p>Countries</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section with photo avatars */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <h2 className="section-title">What Our Learners Say</h2>
          <p className="section-subtitle">Real stories from real students</p>
          <div className="testimonial-carousel">
            <button className="carousel-nav prev" onClick={prevTestimonial}>❮</button>
            <div className="testimonial-card">
              <div className="testimonial-avatar">
                <img 
                  src={`https://randomuser.me/api/portraits/${testimonialIndex % 2 === 0 ? 'women' : 'men'}/${testimonialIndex + 10}.jpg`} 
                  alt="avatar" 
                  className="landing-testimonial-avatar" 
                />
              </div>
              <p className="testimonial-text">"{testimonials[testimonialIndex].feedback}"</p>
              <h4 className="testimonial-name">{testimonials[testimonialIndex].name}</h4>
              <p className="testimonial-role">{testimonials[testimonialIndex].role}</p>
            </div>
            <button className="carousel-nav next" onClick={nextTestimonial}>❯</button>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className={`dot ${i === testimonialIndex ? 'active' : ''}`}
                onClick={() => setTestimonialIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your English?</h2>
          <p>Join thousands of learners achieving their language goals</p>
          <button className="cta-button-xl" onClick={() => navigate('/login')}>Get Started Free</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>📖 Adaptive English</h4>
            <p>Learn English smarter, not harder.</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#privacy">Privacy</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <ul>
              <li><a href="#twitter">Twitter</a></li>
              <li><a href="#facebook">Facebook</a></li>
              <li><a href="#linkedin">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Adaptive English. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
