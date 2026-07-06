import { BigQuery } from '@google-cloud/bigquery';

let bigqueryClient: BigQuery | null = null;

export function getBigQueryClient(): BigQuery | null {
  if (bigqueryClient) return bigqueryClient;

  const projectId = process.env.GCP_PROJECT_ID;
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    console.warn('GCP_PROJECT_ID not set, BigQuery unavailable');
    return null;
  }

  try {
    if (keyFile) {
      bigqueryClient = new BigQuery({ projectId, keyFilename: keyFile });
    } else {
      // Use Application Default Credentials
      bigqueryClient = new BigQuery({ projectId });
    }
    return bigqueryClient;
  } catch (error) {
    console.error('Failed to initialize BigQuery client:', error);
    return null;
  }
}

export const BQ_DATASET = process.env.BQ_DATASET || 'edge_cricket';

export function getTableName(baseName: string, format: string): string {
  const fmt = format.toLowerCase();
  return `\`${BQ_DATASET}.${baseName}_${fmt}\``;
}

export async function queryBigQuery(sql: string, params?: Record<string, any>): Promise<any[]> {
  const client = getBigQueryClient();
  if (!client) {
    throw new Error('BigQuery client not initialized. Set GCP_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS');
  }
  
  const options: any = { query: sql };
  if (params) {
    options.params = params;
  }
  
  const [rows] = await client.query(options);
  return rows;
}