import React from 'react';

export const LoadingSkeleton = ({ count = 3, height = '180px' }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="surface-card"
          style={{
            height,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#F8F6F0',
            border: '1px solid #EBE7DC',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '40%', height: '18px', backgroundColor: '#EDE8DD', borderRadius: '4px' }} />
            <div style={{ width: '80%', height: '24px', backgroundColor: '#E4DEC0', borderRadius: '4px' }} />
            <div style={{ width: '95%', height: '14px', backgroundColor: '#EDE8DD', borderRadius: '4px' }} />
            <div style={{ width: '70%', height: '14px', backgroundColor: '#EDE8DD', borderRadius: '4px' }} />
          </div>
          <div style={{ width: '100%', height: '32px', backgroundColor: '#E0D8CB', borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  );
};
