import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './analytics.css';
class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <main className="fatal"><h1>Let’s get you back to your research.</h1><p>An unexpected error interrupted the view. Your saved data has not been deleted.</p><button onClick={() => location.reload()}>Reload CompetitorLens</button><button onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([localStorage.getItem('competitorlens.v1') || '{}'], { type: 'application/json' })); a.download = 'competitorlens-recovery.json'; a.click(); }}>Download saved data</button></main> : this.props.children; }
}
createRoot(document.getElementById('root')).render(<Boundary><App/></Boundary>);

import './usability.css';

import './automated-research.css';

import './ai-intelligence.css';
