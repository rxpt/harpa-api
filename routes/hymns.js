const express = require("express");
const { param, query } = require("express-validator");
const {
  listHymns,
  getRandomHymn,
  getHymnDetails,
  searchHymnsByTitle,
  searchHymnsByVerse,
  searchHymnsByNumber,
} = require("../controllers/hymnController");
const validate = require("../middlewares/validation");
const router = express.Router();

router.get(
  "/",
  validate([
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  ]),
  listHymns
);

router.get("/random", getRandomHymn);

router.get(
  "/search/title/:title",
  validate([
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    param("title").isString().trim().escape(),
  ]),
  searchHymnsByTitle
);

router.get(
  "/search/verse/:verse",
  validate([
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    param("verse").isString().trim().escape(),
  ]),
  searchHymnsByVerse
);

router.get(
  "/search/number/:number",
  validate([
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    param("number").isString().trim().escape(),
  ]),
  searchHymnsByNumber
);

router.get(
  "/:number",
  validate([
    param("number")
      .isInt()
      .withMessage("O número do hino deve ser um inteiro")
      .toInt(),
  ]),
  getHymnDetails
);

module.exports = router;
