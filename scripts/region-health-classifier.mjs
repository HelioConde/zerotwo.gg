// Pure status classifier for production region monitoring. Never include tokens,
// account identifiers, upstream response bodies or player IDs in diagnostics.
export function classifyRegionResult({httpStatus, riotStatus, errorCode, rateLimited}) {
  if (rateLimited || httpStatus === 429 || riotStatus === 429) return 'rate_limited';
  if ([401,403].includes(riotStatus)) return 'riot_credentials_rejected';
  if ([401,403].includes(httpStatus)) return 'edge_auth_rejected';
  if (httpStatus === 200) return 'ok';
  if (httpStatus === 0) return 'network_or_timeout';
  if (httpStatus === 503 && errorCode === 'unavailable') return 'edge_configuration_missing';
  if (httpStatus === 503 && errorCode === 'player') return 'riot_player_lookup_unavailable';
  if (httpStatus === 404 && errorCode === 'player') return 'riot_account_not_found';
  if ([500,502,503,504].includes(httpStatus)) return 'upstream_or_edge_unavailable';
  return 'unexpected_response';
}
export function isTransientFailure(reason) {
  return reason === 'network_or_timeout' ||
    reason === 'riot_player_lookup_unavailable' ||
    reason === 'upstream_or_edge_unavailable';
}
export function shouldStopRegionChecks(reason) {
  return reason === 'rate_limited' ||
    reason === 'riot_credentials_rejected' ||
    reason === 'edge_auth_rejected' ||
    reason === 'edge_configuration_missing';
}
