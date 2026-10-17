import Svg, { Circle, Ellipse, G, Path, Line, Rect } from 'react-native-svg';
import { D } from '../lib/design';

// Shared inline icons ported from the web app's SVGs.

export function CloseIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx={18} cy={18} r={18} fill={D.primary} />
      <Path d="M12 12L24 24M24 12L12 24" stroke={D.primaryText} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function EditIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Circle cx={18} cy={18} r={18} fill={D.chip} />
      <Path d="M13 23L14.5 19L22 11.5L24.5 14L17 21.5L13 23Z" stroke={D.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M20.5 13L23 15.5" stroke={D.text} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ color = D.text }: { color?: string }) {
  return (
    <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
      <Path d="M8 2L2 9L8 16" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ color = D.text }: { color?: string }) {
  return (
    <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
      <Path d="M2 2L8 9L2 16" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronSmallIcon({ color = D.textMuted }: { color?: string }) {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
      <Path d="M1 1L7 7L1 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EyeIcon({ open }: { open: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={D.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <Circle cx={12} cy={12} r={3} />
        </>
      ) : (
        <>
          <Path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <Line x1={1} y1={1} x2={23} y2={23} />
        </>
      )}
    </Svg>
  );
}

export function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

// Iconos del selector de tipo de registro: aro exterior + pictograma de línea,
// todo con el mismo grosor de trazo (viewBox 88x88).
const SWITCH_STROKE = 5.1;

function SwitchRing({ color }: { color: string }) {
  return <Circle cx={44} cy={44} r={41.2} stroke={color} strokeWidth={SWITCH_STROKE} />;
}

export function PoopSwitchIcon({ color, size = 38 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <SwitchRing color={color} />
      <Path
        d="M30 63H58A6 6 0 0 0 58 51H55A5 5 0 0 0 55 41H51A4.5 4.5 0 0 0 51 32C51 28 48 25.5 45 23C44 27 40.5 29.5 37 32A4.5 4.5 0 0 0 37 41H33A5 5 0 0 0 33 51H30A6 6 0 0 0 30 63Z"
        stroke={color}
        strokeWidth={SWITCH_STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UrineSwitchIcon({ color, size = 38 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <SwitchRing color={color} />
      <Path
        d="M44 22C44 22 30.5 37 30.5 48A13.5 13.5 0 0 0 57.5 48C57.5 37 44 22 44 22Z"
        stroke={color}
        strokeWidth={SWITCH_STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Comida: tenedor y cuchara cruzados.
export function FoodSwitchIcon({ color, size = 38 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <SwitchRing color={color} />
      <G stroke={color} strokeWidth={SWITCH_STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Tenedor de 3 púas (dibujado en vertical y girado -45°): púas y
            cuello macizos, mango con el trazo común */}
        <G transform="rotate(-45 44 44)">
          <G fill={color} stroke="none">
            {[0, 1, 2].map((i) => (
              <Rect key={i} x={35 + i * 7} y={14} width={4} height={14} rx={2} />
            ))}
            <Path d="M35 26H53V29C53 33.5 48 35.5 46.55 39V44H41.45V39C40 35.5 35 33.5 35 29Z" />
          </G>
          <Path d="M44 40V69" />
        </G>
        {/* Cuchara (girada 45°) */}
        <G transform="rotate(45 44 44)">
          <Ellipse cx={44} cy={23} rx={8.5} ry={11.5} />
          <Path d="M44 34.5V69" />
        </G>
      </G>
    </Svg>
  );
}

// Plato de tamaño variable para el selector de cantidad (pequeña/normal/grande).
export function PortionIcon({ level, color }: { level: 0 | 1 | 2; color: string }) {
  const fill = [7, 11, 15][level];
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44" fill="none">
      <Circle cx={22} cy={22} r={19} stroke={color} strokeWidth={2.5} />
      <Circle cx={22} cy={22} r={fill} fill={color} opacity={0.85} />
    </Svg>
  );
}

export function CameraIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

export function GalleryIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Circle cx={8.5} cy={8.5} r={1.5} />
      <Path d="M21 15l-5-5L5 21" />
    </Svg>
  );
}

export function RepeatIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 1l4 4-4 4" />
      <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <Path d="M7 23l-4-4 4-4" />
      <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </Svg>
  );
}
