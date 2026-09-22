import { getPlayerSongs } from "../lib/music-player";

export async function GET() {
  const songs = await getPlayerSongs();
  return new Response(JSON.stringify(songs), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
