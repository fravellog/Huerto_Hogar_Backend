const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Azure SQL
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Conexión a la Base de Datos
sql.connect(dbConfig).then(pool => {
    if (pool.connected) {
        console.log('✅ Backend conectado a Azure SQL');
    }
}).catch(err => {
    console.error('❌ Error conexión SQL:', err);
});

// --- RUTAS API ---

// 1. Obtener todos los productos
app.get('/api/products', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Productos`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 2. INICIALIZAR / REINICIAR DATOS (Versión "Destruir y Reconstruir")
app.post('/api/products/init', async (req, res) => {
    try {
        // 1. ¡ELIMINAR LA TABLA VIEJA! (Si existe)
        // Esto borra la estructura antigua que no tenía 'descripcion'
        await sql.query`DROP TABLE IF EXISTS Productos`;

        // 2. CREAR LA TABLA NUEVA (Con todas las columnas correctas)
        // AGREGAMOS: columna 'unidad' para guardar "kg", "unidad", "saco", etc.
        await sql.query`
            CREATE TABLE Productos (
                id INT PRIMARY KEY IDENTITY(1,1),
                nombre NVARCHAR(100),
                precio INT,
                unidad NVARCHAR(20), -- Nueva columna para la unidad de medida
                stock INT,
                descripcion NVARCHAR(MAX),
                categoria NVARCHAR(50),
                imagen NVARCHAR(200)
            );
        `;

        // 3. Insertar TODOS los productos con su UNIDAD correspondiente
        await sql.query`
            INSERT INTO Productos (nombre, precio, unidad, stock, descripcion, categoria, imagen) VALUES 
            -- FRUTAS
            ('Manzanas', 1200, 'kg', 150, 'Manzanas crujientes y dulces.', 'Fruta', '/Frutas/Manzana.png'),
            ('Naranjas', 1000, 'kg', 200, 'Jugosas y ricas en vitamina C.', 'Fruta', '/Frutas/Naranja.png'),
            ('Mango', 1570, 'unidad', 50, 'Mango frescos', 'Fruta', '/Frutas/Mango.png'),
            ('Frutilla', 3990, 'kg', 50, 'Frutilla por kg', 'Fruta', '/Frutas/Frutilla.png'),
            ('Plátanos', 1570, 'kg', 50, 'Platanos naturales', 'Fruta', '/Frutas/Platanos.png'),
            ('Sandía', 5290, 'unidad', 50, 'Sandia Jugosa', 'Fruta', '/Frutas/Sandia.png'),

            -- VERDURAS
            ('Lechuga', 900, 'unidad', 100, 'Lechuga fresca para ensaladas.', 'Verdura', '/Verduras/Lechuga.png'),
            ('Papas (Saco 5kg)', 5000, 'saco', 80, 'Papas ideales para freír o cocer.', 'Verdura', '/Verduras/Saco_papa.jpg'),
            ('Tomate', 1610, 'kg', 50, 'Tomates frescos', 'Verdura', '/Verduras/tomate.png'), 
            ('Brócoli', 1490, 'unidad', 50, 'Brócoli natural', 'Verdura', '/Verduras/brocoli.png'),
            ('Cebolla', 1420, 'kg', 50, 'Cebolla natural', 'Verdura', '/Verduras/Cebolla.png'),
            ('Zanahorias', 1200, 'kg', 50, 'Zanahoria natural', 'Verdura', '/Verduras/Zanahoria.png');
        `;
        
        res.send("✅ Base de datos RECONSTRUIDA y actualizada con éxito.");
    } catch (err) { 
        console.error(err);
        res.status(500).send(err.message); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});