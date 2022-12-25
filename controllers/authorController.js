const Author = require("../models/author");
const async = require("async");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

exports.author_list = (req, res, next) => {
  Author.find()
    .sort([["family_name", "ascending"]])
    .exec(function (err, list_authors) {
      if (err) {
        return next(err);
      }

      //successful, so render
      res.render("author_list", {
        title: "Author List",
        author_list: list_authors,
      });
    });
};

exports.author_detail = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.params.id).exec(callback);
      },

      authors_books(callback) {
        Book.find({ author: req.params.id }, "title summary").exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.author == null) {
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
      }

      res.render("author_detail", {
        title: "Author Detail",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

exports.author_create_get = (req, res) => {
  res.render("author_form", {
    title: "Create Author",
  });
};

exports.author_create_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .isAlphanumeric()
    .withMessage("Family name must be specified."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    // Extract validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there are errors, load page with values
      res.render("author_form", {
        title: "Create Author",
        author: req.body,
        errors: errors.array(),
      });
    }
    // no errors occured, save sanitized data
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    author.save((err) => {
      if (err) {
        return next(err);
      }

      res.redirect(author.url);
    });
  },
];

exports.author_delete_get = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.params.id).exec(callback);
      },

      author_books(callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.author == null) {
        res.redirect("/catalog/authors");
      }

      res.render("author_delete", {
        title: "Delete Author",
        author: results.author,
        author_books: results.author_books,
      });
    }
  );
};

exports.author_delete_post = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      authors_books(callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.authors_books.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render("author_delete", {
          title: "Delete Author",
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      }
      // Author has no books. Delete object and redirect to the list of authors.
      Author.findByIdAndRemove(req.body.authorid, (err) => {
        if (err) {
          return next(err);
        }
        // Success - go to author list
        res.redirect("/catalog/authors");
      });
    }
  );
};

exports.author_update_get = (req, res) => {
  console.log(req.params.id);
  Author.findById(req.params.id).exec((err, author) => {
    if (err) {
      return next(err);
    }

    if (author == null) {
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }
    console.log(author);
    res.render("author_form", {
      title: "Update Author: " + author.name,
      author,
    });
  });
};

exports.author_update_post = [
  body("first_name", "Invalid first name provided")
    .trim()
    .escape()
    .isLength({ min: 1 }),

  body("family_name", "Invalid family name provided")
    .escape()
    .trim()
    .isLength({ min: 1 }),
  body("date_of_birth").optional({ checkFalsy: true }).isISO8601().toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Update Author: " + author.name,
        author,
        errors: errors.array(),
      });
      return;
    }

    Author.findByIdAndUpdate(req.params.id, author, {}, (err) => {
      if (err) {
        return next(err);
      }

      res.redirect(author.url);
    });
  },
];
