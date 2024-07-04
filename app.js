const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/database");
const hymnsRouter = require("./routes/hymns");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(helmet());

// Conectar ao banco de dados
connectDB();

// Rotas da API
app.use("/hymns", hymnsRouter);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
