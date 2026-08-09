export function resolveWebUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
      return null;
    }
  }

  if (/\s/.test(trimmed)) return null;

  const candidate = trimmed.replace(/^\/\//, '');
  const authority = candidate.split(/[/?#]/, 1)[0];
  const bracketedHost = authority.match(/^\[([^\]]+)](?::(\d+))?$/);
  const regularHost = authority.match(/^([^:]+)(?::(\d+))?$/);

  if (!bracketedHost && !regularHost) return null;

  const hostname = (bracketedHost?.[1] ?? regularHost?.[1] ?? '').toLowerCase();
  const hasPort = Boolean(bracketedHost?.[2] ?? regularHost?.[2]);
  const hasPath = candidate.length > authority.length;
  const isIpv6 = Boolean(bracketedHost && hostname.includes(':'));
  const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');
  const isLoopback = isLocalhost || hostname === '0.0.0.0' || hostname.startsWith('127.') || hostname === '::1';
  const isDottedHost = hostname.includes('.') && /^[a-z0-9.-]+$/i.test(hostname);
  const isIntranetHost = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(hostname) && (hasPort || hasPath);

  if (!isIpv6 && !isIpv4 && !isLocalhost && !isDottedHost && !isIntranetHost) return null;

  try {
    return new URL(`${isLoopback ? 'http' : 'https'}://${candidate}`).href;
  } catch {
    return null;
  }
}

export function webUrlKey(value: string) {
  const href = resolveWebUrl(value);
  if (!href) return null;

  const url = new URL(href);
  url.hash = '';
  if (url.pathname === '/') url.pathname = '';
  return url.href;
}

export function websiteNameFromUrl(value: string) {
  const href = resolveWebUrl(value);
  if (!href) return '';
  return new URL(href).hostname.replace(/^www\./i, '');
}
