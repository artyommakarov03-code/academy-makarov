import React from 'react';
import { createRoot } from 'react-dom/client';
import './data/activateAdvancedContent';
import AppV2 from './AppV2';
import BrandRuntime from './components/BrandRuntime';
import GlobalIdeaHub from './components/GlobalIdeaHub';
import TesterGreeting from './components/TesterGreeting';
import './styles.css';
import './experience-upgrade.css';

createRoot(document.getElementById('root')).render(
  <>
    <AppV2 />
    <BrandRuntime />
    <TesterGreeting />
    <GlobalIdeaHub />
  </>
);
