import { getCloudflareContext } from '@cloudflare/next/dist/framework';

export interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function executeQuery<T>(
  query: string, 
  params: any[] = []
): Promise<DbResult<T>> {
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;
    
    if (!db) {
      return {
        success: false,
        error: 'Veritabanı bağlantısı kurulamadı'
      };
    }

    const result = await db.prepare(query).bind(...params).all();
    
    return {
      success: true,
      data: result as unknown as T
    };
  } catch (error) {
    console.error('Veritabanı sorgusu çalıştırılırken hata oluştu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
    };
  }
}

export async function executeRun(
  query: string, 
  params: any[] = []
): Promise<DbResult<{ changes: number }>> {
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;
    
    if (!db) {
      return {
        success: false,
        error: 'Veritabanı bağlantısı kurulamadı'
      };
    }

    const result = await db.prepare(query).bind(...params).run();
    
    return {
      success: true,
      data: { changes: result.meta.changes }
    };
  } catch (error) {
    console.error('Veritabanı sorgusu çalıştırılırken hata oluştu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
    };
  }
}

export async function executeFirst<T>(
  query: string, 
  params: any[] = []
): Promise<DbResult<T>> {
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;
    
    if (!db) {
      return {
        success: false,
        error: 'Veritabanı bağlantısı kurulamadı'
      };
    }

    const result = await db.prepare(query).bind(...params).first();
    
    return {
      success: true,
      data: result as T
    };
  } catch (error) {
    console.error('Veritabanı sorgusu çalıştırılırken hata oluştu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
    };
  }
}
