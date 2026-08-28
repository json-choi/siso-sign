import { ImageResponse } from 'next/og';

export const alt = '시소사인 - 간판 제작, 사이니지 디자인, 브랜딩';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#0a0a0a',
          color: '#ededed',
          display: 'flex',
          height: '100%',
          justifyContent: 'space-between',
          padding: '80px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div
            style={{
              color: '#a40035',
              display: 'flex',
              fontSize: '92px',
              fontWeight: 800,
              letterSpacing: '-5px',
              lineHeight: 0.9,
            }}
          >
            siso-sign
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '34px',
              fontWeight: 600,
              letterSpacing: '-1px',
            }}
          >
            SIGNS THAT MATTER.
          </div>
          <div
            style={{
              color: '#a3a3a3',
              display: 'flex',
              fontSize: '24px',
              letterSpacing: '4px',
            }}
          >
            SIGNAGE · BRANDING · SPACE DESIGN
          </div>
        </div>
        <div
          style={{
            border: '3px solid #a40035',
            borderRadius: '999px',
            display: 'flex',
            height: '180px',
            width: '180px',
          }}
        />
      </div>
    ),
    size
  );
}
