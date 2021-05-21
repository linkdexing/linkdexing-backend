require("dotenv/config");

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const mongoose = require("mongoose");

const app = express();

const port = process.env.PORT || 4000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(morgan("dev"));

app.use("/api/v1/users", require("./src/api/v1/users/routes"));
app.use("/api/v1/orders", require("./src/api/v1/orders/routes"));

app.use((err, req, res, next) => {
  return res.status(500).json({
    ok: false,
    error: err.message,
  });
});

mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.men9r.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("DB Connected");
    }
  }
);

app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
