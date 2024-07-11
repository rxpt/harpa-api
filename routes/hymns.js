const express = require("express");
const router = express.Router();
const { param, query } = require("express-validator");
const validate = require("../middlewares/validation");
const hymnController = require("../controllers/hymnController");

const commonQueryValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];

const titleOrVerseValidation = [
  ...commonQueryValidation,
  param("searchParam").isString().trim().escape(),
];

const numberValidation = [
  param("number")
    .isInt()
    .withMessage("O número do hino deve ser um inteiro")
    .toInt(),
];

router
  .get("/", validate(commonQueryValidation), hymnController.listHymns)
  .get(
    "/search/title/:searchParam",
    validate(titleOrVerseValidation),
    hymnController.searchHymnsByTitle
  )
  .get(
    "/search/verse/:searchParam",
    validate(titleOrVerseValidation),
    hymnController.searchHymnsByVerse
  )
  .get(
    "/search/number/:number",
    validate([...commonQueryValidation, ...numberValidation]),
    hymnController.searchHymnsByNumber
  )
  .get("/random", hymnController.getRandomHymn)
  .get("/:number", validate(numberValidation), hymnController.getHymnDetails);

module.exports = router;
