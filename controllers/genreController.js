const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = (req, res) => {
  Genre.find()
    .sort({ name: 1 })
    .exec((err, list_genders) => {
      if (err) {
        next(err);
      }

      res.render("genre_list", {
        title: "Genre List",
        genre_list: list_genders,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  // const id = mongoose.Types.ObjectId(req.params.id);
  console.log(req.params.id);

  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.render("genre_form", {
    title: "Create Genre",
  });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // process request after validation
  (req, res, next) => {
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors, render form again with sanitized values/errors
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid
      // Check if Genre with the same name already exists

      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          res.redirect(found_genre.url);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }

            // Genre saved.
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  Genre.findById(req.params.id).exec((err, genre) => {
    if (err) {
      return next(err);
    }

    if (genre == null) {
      const err = new Error("Genre not found.");
      err.status = 404;
      return next(err);
    }

    res.render("genre_delete", {
      title: `Delete: ${genre.name}`,
      genre,
    });
  });
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  // Checking with the database that genre really doesn't have any books associated with it.

  async.parallel(
    {
      books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },

      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.books.length > 0) {
        res.render("genre_delete", {
          title: `Delete: ${results.genre.name}`,
          results: results.genre,
          books: results.book,
        });
      }

      Genre.findByIdAndDelete(req.params.id, (err) => {
        if (err) {
          return next(err);
        }

        res.redirect("/catalog/genres");
      });
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id, (err, genre) => {
    if (err) {
      return next(err);
    }

    if (genre == null) {
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }

    res.render("genre_form", {
      title: "Update Genre: " + genre.name,
      genre,
    });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Genre name not valid").trim().escape().isLength({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      Genre.findById(req.params.id).exec((err, genre) => {
        if (err) {
          return next(err);
        }

        if (genre == null) {
          const err = new Error("Genre not found");
          err.status = 404;
          return next(err);
        }

        res.render("genre_form", {
          title: "Update Genre: " + genre.name,
          genre,
          errors: errors.array(),
        });
      });
      return;
    }

    Genre.findByIdAndUpdate(req.params.id, genre, {}, (err) => {
      if (err) {
        return next(err);
      }

      res.redirect("/catalog/genres");
    });
  },
];
