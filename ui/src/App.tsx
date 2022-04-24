import React from 'react';
import './App.css';
import Navbar from './navbar/Navbar';
import Interface from './interface/Interface';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Navbar />
        <Interface />
      </header>
    </div>
  );
}

export default App;
