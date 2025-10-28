/**
 * P5B3: API Versioning Utility
 *
 * Centralized API versioning management
 * Supports multiple API versions with deprecation notices
 *
 * Usage:
 * - Current version: v1
 * - Base path: /api/v1/*
 * - Legacy endpoints: /api/* (unversioned, maintained for backward compatibility)
 */

import { NextRequest, NextResponse } from 'next/server';

export const API_VERSIONS = {
  V1: 'v1',
  LEGACY: 'legacy',
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

export const CURRENT_VERSION: ApiVersion = API_VERSIONS.V1;
export const DEPRECATED_VERSIONS: ApiVersion[] = [];

interface VersionInfo {
  version: ApiVersion;
  status: 'active' | 'deprecated' | 'sunset';
  deprecationDate?: string;
  sunsetDate?: string;
  message?: string;
}

/**
 * API version information
 */
export const VERSION_INFO: Record<string, VersionInfo> = {
  [API_VERSIONS.V1]: {
    version: 'v1',
    status: 'active',
    message: 'Current stable version',
  },
  [API_VERSIONS.LEGACY]: {
    version: 'legacy',
    status: 'active',
    message: 'Unversioned endpoints maintained for backward compatibility',
  },
};

/**
 * Extract API version from request path
 */
export function getApiVersion(request: NextRequest): ApiVersion {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/api\/(v\d+)\//);

  if (match) {
    return match[1] as ApiVersion;
  }

  return API_VERSIONS.LEGACY;
}

/**
 * Add versioning headers to response
 */
export function addVersionHeaders(
  response: NextResponse,
  version: ApiVersion
): NextResponse {
  const headers = new Headers(response.headers);
  const versionInfo = VERSION_INFO[version];

  headers.set('X-API-Version', version);
  headers.set('X-API-Version-Current', CURRENT_VERSION);

  if (versionInfo.status === 'deprecated') {
    headers.set('X-API-Deprecated', 'true');
    if (versionInfo.deprecationDate) {
      headers.set('X-API-Deprecation-Date', versionInfo.deprecationDate);
    }
    if (versionInfo.sunsetDate) {
      headers.set('X-API-Sunset-Date', versionInfo.sunsetDate);
    }
    if (versionInfo.message) {
      headers.set('X-API-Deprecation-Info', versionInfo.message);
    }
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  return DEPRECATED_VERSIONS.includes(version);
}

/**
 * Get version info
 */
export function getVersionInfo(version: ApiVersion): VersionInfo | undefined {
  return VERSION_INFO[version];
}

/**
 * Format API version response
 */
export function createVersionedResponse<T>(
  data: T,
  version: ApiVersion,
  status: number = 200
): NextResponse {
  const versionInfo = VERSION_INFO[version];
  const responseBody: any = data;

  // Add deprecation warning to body if needed
  if (versionInfo?.status === 'deprecated') {
    responseBody._meta = {
      version,
      deprecated: true,
      message: versionInfo.message,
      deprecationDate: versionInfo.deprecationDate,
      sunsetDate: versionInfo.sunsetDate,
      currentVersion: CURRENT_VERSION,
    };
  }

  const response = NextResponse.json(responseBody, { status });
  return addVersionHeaders(response, version);
}

/**
 * Middleware to enforce version deprecation
 */
export async function enforceVersionDeprecation(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const version = getApiVersion(request);
  const versionInfo = VERSION_INFO[version];

  // Check if version is sunset (no longer supported)
  if (versionInfo?.status === 'sunset') {
    return NextResponse.json(
      {
        success: false,
        error: 'API version no longer supported',
        message: versionInfo.message,
        currentVersion: CURRENT_VERSION,
      },
      {
        status: 410, // Gone
        headers: {
          'X-API-Version': version,
          'X-API-Status': 'sunset',
          'X-API-Current-Version': CURRENT_VERSION,
        },
      }
    );
  }

  // Process request
  const response = await handler(request);

  // Add version headers
  return addVersionHeaders(response, version);
}
