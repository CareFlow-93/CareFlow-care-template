import React from 'react';

export function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>{title}</h1>
        {subtitle ? <p style={{ color: '#555', marginTop: 8 }}>{subtitle}</p> : null}
      </header>
      {children}
    </main>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        border: '1px solid #ddd',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {children}
    </section>
  );
}