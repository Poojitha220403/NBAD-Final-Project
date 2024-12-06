import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import useToken from './useToken';
import './css/Welcome.css';
import { Link } from 'react-router-dom';
import { Brain, Sparkles, ChevronRight } from 'lucide-react';

function Welcome() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { token } = useToken();
  const history = useHistory();

  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (token) {
      history.push('/dashboard');
    }
  }, [token, history]);

  return (
    <div className="welcomeContainer">
      <div 
        className="creativeBg" 
        style={{ 
          backgroundPosition: `${mousePosition.x / 50}px ${mousePosition.y / 50}px` 
        }}
      ></div>
      <header className="header">
        <Brain className="logo" />
        <h1 className="title">
          GEN AI
          <span className="titleHighlight">Innovations</span>
        </h1>
      </header>
      <main className="main">
        <section className="about">
          <h2>Pioneering the Future</h2>
          <p>
            Embark on a journey through the cutting-edge world of Generative AI. This project, developed and deployed by <span className='developer'>POOJITHA</span>, showcases the latest advancements that are reshaping our digital landscape.
          </p>
          <Sparkles className="sparkle1" />
          <Sparkles className="sparkle2" />
        </section>
        <section className="cta">
          <div className="ctaContent">
            <h2>Explore the Innovation Hub</h2>
            <p>Dive into a realm where AI pushes the boundaries of possibility.</p>
            <Link to="/dashboard" className="ctaButton">
              Enter <ChevronRight className="icon" />
            </Link>
          </div>
          <div className="ctaVisual">
            <div className="neuralNetwork">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="node" style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}>
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="link" style={{
                      width: `${50 + Math.random() * 100}px`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <p>&copy; 2024 Poojitha</p>
      </footer>
    </div>
  );
}

export default Welcome;