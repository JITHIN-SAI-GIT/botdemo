import React from "react";

const LoadingSpinner = ({ size = 24 }) => {
  return (
    <div
      style={{
        display: "inline-block",
        width: `${size}px`,
        height: `${size}px`,
        border: "3px solid var(--border-color)",
        borderTop: "3px solid var(--accent-color)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
