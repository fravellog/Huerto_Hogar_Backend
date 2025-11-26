const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: false }
};

// Conectar a BD
sql.connect(dbConfig).then(pool => {
    if (pool.connected) console.log('✅ Backend conectado a Azure SQL');
}).catch(err => console.error('❌ Error conexión SQL:', err));

// --- RUTAS ---

// 1. Obtener todos los productos
app.get('/api/products', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Productos`;
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

// 2. INICIALIZAR DATOS (Ejecutar una vez para llenar la tabla)
app.post('/api/products/init', async (req, res) => {
    try {
        await sql.query`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Productos' and xtype='U')
            CREATE TABLE Productos (
                id INT PRIMARY KEY IDENTITY(1,1),
                nombre NVARCHAR(100),
                precio INT,
                categoria NVARCHAR(50),
                imagen NVARCHAR(200),
                stock INT
            );
            
            TRUNCATE TABLE Productos; -- Limpia tabla para no duplicar

            -- Insertamos datos con las rutas EXACTAS de tu carpeta 'public'
            INSERT INTO Productos (nombre, precio, categoria, imagen, stock) VALUES 
            ('Manzanas', 1200, 'Fruta', '/Frutas/Manzana.png', 100),
            ('Naranjas', 1000, 'Fruta', '/Frutas/Naranja.png', 100),
            ('Lechuga', 900, 'Verdura', '/Verduras/Lechuga.png', 50),
            ('Papas (Saco 5kg)', 5000, 'Verdura', '/Verduras/Saco_papa.jpg', 20),
            ('Tomate', 1610, 'Verdura', '/tomate.png', 60), -- Ojo: vi que tomate estaba en la raiz public/
            ('Zanahorias', 1200, 'Verdura', '/Verduras/Zanahoria.png', 80),
            ('Sandía', 5290, 'Fruta', '/Frutas/Sandia.png', 30);
        `;
        res.send("✅ Datos de Huerto Hogar cargados en Azure.");
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));