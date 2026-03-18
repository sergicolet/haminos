
const { Pool } = require('pg');

async function checkTable() {
    const pool = new Pool({
        connectionString: 'postgres://db_admin:a086add4745d09b3bdc6@localhost:5432/db_data',
        ssl: false
    });
    try {
        const res = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        console.log('Exists users table:', res.rows[0].exists);
    } catch (e) {
        console.error('Error checking table:', e.message);
    } finally {
        await pool.end();
    }
}
checkTable();
