const mongoose = require("mongoose");

const hymnSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  author: { type: String },
  verses: [
    {
      sequence: Number,
      lyrics: String,
      chorus: Boolean,
    },
  ],
});

hymnSchema.index({ number: 1 });
hymnSchema.index({ title: "text" });
hymnSchema.index({ "verses.lyrics": "text" });

module.exports = mongoose.model("Hymn", hymnSchema, "hinos");
