import React from 'react';

const StreamingText = ({ text, isStreaming = false }) => {
  return (
    <div style={{ whiteSpace: 'pre-wrap', display: 'inline' }}>
      {text}
      {isStreaming && (
        <span
          style={{
            display: 'inline-block',
            width: '2px',
            height: '14px',
            backgroundColor: 'currentColor',
            marginLeft: '2px',
            verticalAlign: 'middle',
            animation: 'blink 0.7s ease-in-out infinite alternate'
          }}
        />
      )}
      <style>{`
        @keyframes blink {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StreamingText;
