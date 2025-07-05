export interface MongoDbStats {
  avgObjSize: number;
  dataSize: number;
  storageSize: number;

  totalSize: number;

  fsUsedSize: number;
  fsTotalSize: number;
  ok: number;
}

export const formatMongoDbStats = (rawStats: any) => {
  if (!rawStats) return null;

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return {
    avgObjSize: formatBytes(rawStats.avgObjSize),
    dataSize: formatBytes(rawStats.dataSize),
    storageSize: formatBytes(rawStats.storageSize),

    totalSize: formatBytes(rawStats.totalSize),

    fsUsedSize: formatBytes(rawStats.fsUsedSize),
    fsTotalSize: formatBytes(rawStats.fsTotalSize),
    ok: rawStats.ok === 1 ? 'OK' : 'Error',
  };
};
