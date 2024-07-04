const Hymn = require("../models/Hymn");
const cache = require("../utils/cache");

// Função auxiliar para lidar com paginação
const paginate = (page, limit) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(50, parseInt(limit) || 10);
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip };
};

// Função auxiliar para lidar com busca e paginação
const searchWithPagination = async (
  query,
  projection,
  page,
  limit,
  cacheKey
) => {
  const { skip } = paginate(page, limit);
  let totalHymns = cache.get(`${cacheKey}_totalHymns`);
  if (!totalHymns) {
    totalHymns = await Hymn.countDocuments(query);
    cache.set(`${cacheKey}_totalHymns`, totalHymns);
  }
  let hymns = cache.get(`${cacheKey}_hymns_${page}_${limit}`);
  if (!hymns) {
    hymns = await Hymn.find(query, projection).skip(skip).limit(limit).lean();
    cache.set(`${cacheKey}_hymns_${page}_${limit}`, hymns);
  }
  return { hymns, totalHymns };
};

// Listar números dos hinos
const listHymns = async (req, res) => {
  try {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const cacheKey = "listHymns";
    const { hymns, totalHymns } = await searchWithPagination(
      {},
      "number title -_id",
      page,
      limit,
      cacheKey
    );
    res.json({
      hymns,
      currentPage: page,
      totalPages: Math.ceil(totalHymns / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar hinos" });
  }
};

// Retornar um hino aleatório
const getRandomHymn = async (req, res) => {
  try {
    const count = cache.get("hymnCount") || (await Hymn.countDocuments());
    cache.set("hymnCount", count);
    const random = Math.floor(Math.random() * count);
    const cacheKey = `randomHymn_${random}`;
    let hymn = cache.get(cacheKey);
    if (!hymn) {
      hymn = await Hymn.findOne({}, "-_id").skip(random).lean();
      if (!hymn)
        return res.status(404).json({ error: "Nenhum hino encontrado" });
      cache.set(cacheKey, hymn);
    }
    const [prevHymn, nextHymn] = await Promise.all([
      Hymn.findOne({ number: { $lt: hymn.number } }, "number title -_id")
        .sort({ number: -1 })
        .lean(),
      Hymn.findOne({ number: { $gt: hymn.number } }, "number title -_id")
        .sort({ number: 1 })
        .lean(),
    ]);
    res.json({
      hymn,
      prevHymn,
      nextHymn,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar hino aleatório" });
  }
};

// Detalhes do hino
const getHymnDetails = async (req, res) => {
  try {
    const number = parseInt(req.params.number);
    const cacheKey = `hymnDetails_${number}`;
    let hymn = cache.get(cacheKey);
    if (!hymn) {
      hymn = await Hymn.findOne({ number }, "-_id").lean();
      if (!hymn) {
        return res.status(404).json({ error: "Hino não encontrado" });
      }
      cache.set(cacheKey, hymn);
    }
    const [prevHymn, nextHymn] = await Promise.all([
      Hymn.findOne({ number: { $lt: number } }, "number title -_id")
        .sort({ number: -1 })
        .lean(),
      Hymn.findOne({ number: { $gt: number } }, "number title -_id")
        .sort({ number: 1 })
        .lean(),
    ]);
    res.json({
      hymn,
      prevHymn,
      nextHymn,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao obter detalhes do hino" });
  }
};

// Buscar hinos por título
const searchHymnsByTitle = async (req, res) => {
  try {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const title = req.params.title;
    const query = { title: { $regex: title, $options: "i" } };
    const cacheKey = `searchHymnsByTitle_${title}`;
    const { hymns, totalHymns } = await searchWithPagination(
      query,
      "title number -_id",
      page,
      limit,
      cacheKey
    );
    if (hymns.length === 0)
      return res.status(404).json({ error: "Nenhum hino encontrado" });
    res.json({
      hymns,
      currentPage: page,
      totalPages: Math.ceil(totalHymns / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar hinos por título" });
  }
};

// Buscar hinos por estrofe
const searchHymnsByVerse = async (req, res) => {
  try {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const verse = req.params.verse;
    const query = { "verses.lyrics": { $regex: verse, $options: "i" } };
    const cacheKey = `searchHymnsByVerse_${verse}`;
    const { hymns, totalHymns } = await searchWithPagination(
      query,
      "title number -_id",
      page,
      limit,
      cacheKey
    );
    if (hymns.length === 0)
      return res.status(404).json({ error: "Nenhum hino encontrado" });
    res.json({
      hymns,
      currentPage: page,
      totalPages: Math.ceil(totalHymns / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar hinos por estrofe" });
  }
};

// Buscar hinos por número semelhante
const searchHymnsByNumber = async (req, res) => {
  try {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const number = req.params.number;
    const query = {
      $expr: {
        $regexMatch: {
          input: { $toString: "$number" },
          regex: number,
          options: "i",
        },
      },
    };
    const cacheKey = `searchHymnsByNumber_${number}`;
    const { hymns, totalHymns } = await searchWithPagination(
      query,
      "number title -_id",
      page,
      limit,
      cacheKey
    );
    if (hymns.length === 0)
      return res.status(404).json({ error: "Nenhum hino encontrado" });
    res.json({
      hymns,
      currentPage: page,
      totalPages: Math.ceil(totalHymns / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar hinos por número" });
  }
};

module.exports = {
  listHymns,
  getRandomHymn,
  getHymnDetails,
  searchHymnsByTitle,
  searchHymnsByVerse,
  searchHymnsByNumber,
};
