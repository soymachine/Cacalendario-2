// Adaptación a iPad. Con `ios.supportsTablet` y sin `requireFullScreen`, Expo
// declara en el Info.plist las cuatro orientaciones de iPad y la multitarea
// (Split View / Slide Over): la ventana puede girar y cambiar de ancho en
// cualquier momento, así que todo se calcula con useWindowDimensions (nunca
// con Dimensions.get a nivel de módulo). En iPhone ninguno de estos umbrales
// se alcanza y la interfaz es la de siempre.
import { useWindowDimensions } from 'react-native';
import type { ModalProps } from 'react-native';

// A partir de este ancho de ventana, la pestaña Pacientes muestra lista y
// ficha a la vez (iPad en horizontal e iPad Pro 12,9" en vertical).
const SPLIT_MIN_WIDTH = 1000;
export const LIST_PANE_WIDTH = 380; // incluye el borde derecho de 1 px

// Ancho mínimo del área de la ficha para repartirla en dos columnas (como MW).
const DETAIL_TWO_COLUMN_MIN_WIDTH = 760;
export const DETAIL_SIDEBAR_WIDTH = 340;

// Todos los umbrales de ancho de la app, en un solo sitio.
export function useLayout() {
  const { width } = useWindowDimensions();
  const isSplit = width >= SPLIT_MIN_WIDTH;
  const detailWidth = isSplit ? width - LIST_PANE_WIDTH : width;
  return {
    isSplit,
    detailTwoColumns: detailWidth >= DETAIL_TWO_COLUMN_MIN_WIDTH,
  };
}

// Los <Modal> de React Native en iOS solo admiten vertical por defecto: en un
// iPad en horizontal girarían la pantalla al abrirse.
export const MODAL_ORIENTATIONS: ModalProps['supportedOrientations'] = [
  'portrait', 'portrait-upside-down', 'landscape-left', 'landscape-right',
];
