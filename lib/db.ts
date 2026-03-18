import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necesario para evitar cortes de conexión desde el exterior si Easypanel maneja la conexión con SSL auto-firmado
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
