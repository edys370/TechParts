import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { config } from './config';

const app = express();

// Middlewares globales
app.use(
  cors({
    origin: config.corsOrigin === '*' ? '*' : [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enrutador de la API
app.use('/api', routes);

// Middleware de manejo de errores
app.use(errorHandler);

export default app;
