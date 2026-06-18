export function worldGamesRoom(worldId: string): string {
  return `world:${worldId}`;
}

export function gameLobbyRoom(sessionId: string): string {
  return `game:${sessionId}`;
}
