const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Algo deu errado, tente novamente mais tarde." });
};

module.exports = errorHandler;
