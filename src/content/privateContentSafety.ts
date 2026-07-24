export function forbiddenPrivatePath(path: string): boolean {
  const normalized = path.replaceAll('\\', '/').toLowerCase()
  return normalized.split('/').includes('private-content')
    || normalized.endsWith('.private-pack.json')
    || normalized.endsWith('.manual-pack.json')
}
