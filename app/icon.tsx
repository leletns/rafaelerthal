import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#007AFF',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 200,
            letterSpacing: '-2px',
            lineHeight: 1,
            paddingBottom: 2,
          }}
        >
          b.
        </span>
      </div>
    ),
    { ...size }
  );
}
