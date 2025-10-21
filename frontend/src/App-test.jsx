// Diagnostic version to test what's causing blank screen
import { useState, useEffect } from "react";

function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log("App component mounted!");
    setMounted(true);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'purple' }}>Test App</h1>
      <p>App mounted: {mounted ? 'YES' : 'NO'}</p>
      <p>If you can see this, React is working!</p>
    </div>
  );
}

export default App;
