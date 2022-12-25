const BookInstance = require("../models/bookinstance");
const async = require("async");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }

      if (bookinstance == null) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }

      res.render("bookinstance_detail", {
        title: `Copy ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title")
    .sort({ title: 1 })
    .exec((err, books) => {
      if (err) {
        return next(err);
      }

      if (books == null) {
        const error = new Error("Book not found");
        error.status = 404;
        return next(error);
      }

      res.render("bookinstance_form", {
        title: "Create Bookinstace",
        books,
        status: BookInstance.schema.path("status").enumValues,
      });
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // sanitize data

  body("book", "Book can't be empty.").trim().escape().isLength({ min: 1 }),
  body("imprint", "Imprint can't be empty")
    .trim()
    .escape()
    .isLength({ min: 1 }),
  body("date", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("status", "Can't be empty").trim().escape().isLength({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.dueback,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title")
        .sort({ title: 1 })
        .exec((err, books) => {
          res.render("bookinstance_form", {
            title: "Create Bookinstace",
            books,
            bookinstance,
            status: BookInstance.schema.path("status").enumValues,
            errors: errors.array(),
          });
        });
      return;
    }

    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }

      res.redirect("/catalog/bookinstances");
    });
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id).exec((err, result) => {
    if (err) {
      return err;
    }

    res.render("bookinstance_delete", {
      title: "Delete instance",
      bookinstance: result,
    });
  });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndDelete(req.body.bookinstance, (err, bookinstance) => {
    if (err) {
      return next(err);
    }

    if (bookinstance == null) {
      const error = new Error("Bookinstance not found");
      error.status = 404;
      return next(err);
    }

    res.redirect("/catalog/bookinstances");
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
      books(callback) {
        Book.find({}, "title").sort({ title: 1 }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      res.render("bookinstance_form", {
        bookinstance: results.bookinstance,
        books: results.books,
        status: BookInstance.schema.path("status").enumValues,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "You must provide book").trim().escape().isLength({ min: 1 }),
  body("imprint", "Imprint must be filled")
    .trim()
    .escape()
    .isLength({ min: 1 }),
  body("duedate", "Due Date must be filled")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("status", " Status must be filled").trim().escape().isLength({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.duedate,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title")
        .sort({ title: 1 })
        .exec((err, books) => {
          if (err) {
            return next(err);
          }

          if (books == "null") {
            const error = new Error("There are no books created");
            error.status = 404;
            return next(error);
          }

          res.render("bookinstance_form", {
            books,
            bookinstance,
            errors: errors.array(),
            status: BookInstance.schema.path("status").enumValues,
          });
        });
      return;
    }

    BookInstance.findByIdAndUpdate(
      req.params.id,
      bookinstance,
      {},
      (err, updated_bookinstance) => {
        if (err) {
          return next(err);
        }

        res.redirect(updated_bookinstance.url);
      }
    );
  },
];
