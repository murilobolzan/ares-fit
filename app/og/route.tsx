import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 900, color: '#FFFFFF', display: 'flex', alignItems: 'center' }}>
          Ares<span style={{ color: '#FFE600' }}>Fit</span>
        </div>
        <div style={{ fontSize: 28, color: '#A1A1AA', marginTop: 16 }}>
          Treine. Evolua. Domine.
        </div>
        <div style={{
          marginTop: 40,
          padding: '12px 32px',
          background: '#FFE600',
          color: '#000000',
          borderRadius: 100,
          fontSize: 20,
          fontWeight: 700
        }}>
          O app de academia mais completo do Brasil
        </div>
      </div>
    ),
    { 
      width: 1200, 
      height: 630 
    }
  );
}