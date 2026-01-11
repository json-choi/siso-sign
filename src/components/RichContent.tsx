'use client';

interface RichContentProps {
  html: string;
  className?: string;
}

export default function RichContent({ html, className = '' }: RichContentProps) {
  return (
    <div 
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}
