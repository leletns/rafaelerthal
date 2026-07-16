import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: '#007AFF',
        borderRadius: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          color: '#fff',
          fontSize: 124,
          fontWeight: 200,
          letterSpacing: '-10px',
          lineHeight: 1,
          paddingBottom: 12,
          fontFamily: 'sans-serif',
        }}
      >
        b.
      </span>
    </div>,
    { ...size }
  );
}
