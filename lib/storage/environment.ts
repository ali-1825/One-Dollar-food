export function useBlobStorage(): boolean {
  return process.env.VERCEL_ENV === 'production' && Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function getStorageMode(): 'blob' | 'local' {
  return useBlobStorage() ? 'blob' : 'local';
}
