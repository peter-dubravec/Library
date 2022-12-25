const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const moment = require("moment");
const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["Availible", "Maintanance", "Loaned", "Reserved"],
    default: "Maintanance",
  },
  due_back: { type: Date, default: Date.now },
});

BookInstanceSchema.virtual("url").get(function () {
  return `/catalog/bookinstance/${this._id}`;
});

BookInstanceSchema.virtual("due_back_formatted").get(function () {
  return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

BookInstanceSchema.virtual("due_back_Y_M_D").get(function () {
  return moment(this.due_back).format("YYYY-MM-DD");
});

module.exports = mongoose.model("BookInstance", BookInstanceSchema);
