import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const MermaidChart = ({ code }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current && code) {
      const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
      mermaid.render(id, code)
        .then((result) => {
          if (chartRef.current) {
            chartRef.current.innerHTML = result.svg;
          }
        })
        .catch(err => {
          console.error("Mermaid parsing error:", err);
          if (chartRef.current) {
            chartRef.current.innerHTML = `<div style="color: red; padding: 12px; border: 1px solid red; border-radius: 4px;">Error parsing Mermaid chart.</div>`;
          }
        });
    }
  }, [code]);

  return (
    <div 
      ref={chartRef} 
      className="mermaid-chart-container" 
      style={{ margin: '16px 0', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary, #fff)', padding: '16px', borderRadius: '8px' }} 
    />
  );
};

export default MermaidChart;
