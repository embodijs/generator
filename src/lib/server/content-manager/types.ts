export interface AbortException {
  code: 'ENOENT',
  errno: number,
  syscall: 'open'
}