const Hymn = require("../models/Hymn");
const cache = require("../utils/cache");

const PROJECTION_FIELDS = "title number -_id";

const getPagination = (page, limit) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const itemsPerPage = Math.min(50, parseInt(limit, 10) || 10);
  const offset = (currentPage - 1) * itemsPerPage;
  return { currentPage, itemsPerPage, offset };
};

const searchHymnsWithPagination = async (
  query,
  projection,
  page,
  limit,
  cacheKey,
  sortOrder = 1
) => {
  const { currentPage, itemsPerPage, offset } = getPagination(page, limit);

  let totalHymns = cache.get(`${cacheKey}_totalHymns`);
  if (!totalHymns) {
    totalHymns = await Hymn.countDocuments(query);
    cache.set(`${cacheKey}_totalHymns`, totalHymns);
  }

  let hymns = cache.get(
    `${cacheKey}_hymns_${currentPage}_${itemsPerPage}_${sortOrder}`
  );
  if (!hymns) {
    hymns = await Hymn.find(query, projection)
      .sort({ number: sortOrder })
      .skip(offset)
      .limit(itemsPerPage)
      .lean();
    cache.set(
      `${cacheKey}_hymns_${currentPage}_${itemsPerPage}_${sortOrder}`,
      hymns
    );
  }

  const totalPages = Math.ceil(totalHymns / itemsPerPage);
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return {
    totalHymns,
    totalPages,
    currentPage,
    prevPage,
    nextPage,
    hymns,
  };
};

const findAdjacentHymns = async (number) => {
  const [prevHymn, nextHymn] = await Promise.all([
    Hymn.findOne({ number: { $lt: number } }, PROJECTION_FIELDS)
      .sort({ number: -1 })
      .lean(),
    Hymn.findOne({ number: { $gt: number } }, PROJECTION_FIELDS)
      .sort({ number: 1 })
      .lean(),
  ]);
  return { prevHymn, nextHymn };
};

const handleHymnRequest = async (req, res, query, cacheKeyPrefix) => {
  try {
    const { currentPage, itemsPerPage } = getPagination(
      req.query.page,
      req.query.limit
    );
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
    const cacheKey = `${cacheKeyPrefix}_${JSON.stringify(query)}`;

    const response = await searchHymnsWithPagination(
      query,
      PROJECTION_FIELDS,
      currentPage,
      itemsPerPage,
      cacheKey,
      sortOrder
    );

    if (response.hymns.length === 0) {
      return res.status(404).json({ error: "Nenhum hino encontrado" });
    }

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar hinos" });
  }
};

const listHymns = (req, res) => handleHymnRequest(req, res, {}, "listHymns");

const getRandomHymn = async (_, res) => {
  try {
    const hymnCount = cache.get("hymnCount") || (await Hymn.countDocuments());
    cache.set("hymnCount", hymnCount);

    const randomIndex = Math.floor(Math.random() * hymnCount);
    const hymn = await Hymn.findOne({}, "-_id").skip(randomIndex).lean();

    if (!hymn) return res.status(404).json({ error: "Nenhum hino encontrado" });

    const { prevHymn, nextHymn } = await findAdjacentHymns(hymn.number);
    res.json({ hymn, prevHymn, nextHymn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar hino aleatório" });
  }
};

const getHymnDetails = async (req, res) => {
  try {
    const hymnNumber = parseInt(req.params.number, 10);
    const cacheKey = `hymnDetails_${hymnNumber}`;

    let hymn = cache.get(cacheKey);
    if (!hymn) {
      hymn = await Hymn.findOne({ number: hymnNumber }, "-_id").lean();
      if (!hymn) return res.status(404).json({ error: "Hino não encontrado" });
      cache.set(cacheKey, hymn);
    }

    const { prevHymn, nextHymn } = await findAdjacentHymns(hymnNumber);
    res.json({ hymn, prevHymn, nextHymn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao obter detalhes do hino" });
  }
};

const searchHymnsByTitle = (req, res) =>
  handleHymnRequest(
    req,
    res,
    { title: { $regex: req.params.searchParam, $options: "i" } },
    "searchHymnsByTitle"
  );

const searchHymnsByVerse = (req, res) =>
  handleHymnRequest(
    req,
    res,
    { "verses.lyrics": { $regex: req.params.searchParam, $options: "i" } },
    "searchHymnsByVerse"
  );

const searchHymnsByNumber = (req, res) =>
  handleHymnRequest(
    req,
    res,
    {
      $expr: {
        $regexMatch: {
          input: { $toString: "$number" },
          regex: String(req.params.number),
          options: "i",
        },
      },
    },
    "searchHymnsByNumber"
  );

module.exports = {
  listHymns,
  getRandomHymn,
  getHymnDetails,
  searchHymnsByTitle,
  searchHymnsByVerse,
  searchHymnsByNumber,
};
