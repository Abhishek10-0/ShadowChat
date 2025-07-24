export function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'a while ago';
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return new Date(lastSeen).toLocaleString();
}
