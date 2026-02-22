declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      center?: [number, number];
      scale?: number;
      rotate?: [number, number, number];
      parallels?: [number, number];
    };
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: GeoFeature[]; outline: object; borders: object }) => React.ReactNode;
    parseGeographies?: (features: GeoFeature[]) => GeoFeature[];
    className?: string;
  }

  export interface GeoFeature {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: object;
    type: string;
  }

  export interface GeographyProps {
    geography: GeoFeature;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    className?: string;
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseDown?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseUp?: (event: React.MouseEvent<SVGPathElement>) => void;
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
    onFocus?: (event: React.FocusEvent<SVGPathElement>) => void;
    onBlur?: (event: React.FocusEvent<SVGPathElement>) => void;
  }

  export const ComposableMap: React.ForwardRefExoticComponent<ComposableMapProps & React.RefAttributes<SVGSVGElement>>;
  export const Geographies: React.ForwardRefExoticComponent<GeographiesProps & React.RefAttributes<SVGGElement>>;
  export const Geography: React.ForwardRefExoticComponent<GeographyProps & React.RefAttributes<SVGPathElement>>;
  export const Marker: React.ForwardRefExoticComponent<React.SVGProps<SVGGElement> & React.RefAttributes<SVGGElement>>;
  export const Line: React.ForwardRefExoticComponent<React.SVGProps<SVGPathElement> & React.RefAttributes<SVGPathElement>>;
  export const Annotation: React.ForwardRefExoticComponent<React.SVGProps<SVGGElement> & React.RefAttributes<SVGGElement>>;
  export const Graticule: React.ForwardRefExoticComponent<React.SVGProps<SVGPathElement> & React.RefAttributes<SVGPathElement>>;
  export const Sphere: React.ForwardRefExoticComponent<React.SVGProps<SVGPathElement> & React.RefAttributes<SVGPathElement>>;
  export function useGeographies(params: { geography: string | object; parseGeographies?: (features: GeoFeature[]) => GeoFeature[] }): {
    geographies: GeoFeature[];
    outline: object;
    borders: object;
  };
}
