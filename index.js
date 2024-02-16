require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const Person = require("./models/person");

const app = express();
app.use(express.json());
app.use(cors());

app.use(
  morgan((tokens, request, response) => {
    let data = "";
    if (tokens.method(request, response) === "POST") {
      data = JSON.stringify(request.body);
    }
    return `${tokens.method(request, response)} ${tokens.url(
      request,
      response
    )} ${tokens.status(request, response)} ${tokens.res(
      request,
      response,
      "content-length"
    )} - ${tokens["response-time"](request, response)}ms ${data}`;
  })
);

// const generateId = () => Math.floor(Math.random() * 10000);

app.get("/info", (_, response, next) => {
  Person.find({})
    .then((people) => {
      const date = new Date();
      response.send(
        `<p>Phonebook has info for ${people.length} people</p><p>${date}</p>`
      );
    })
    .catch((error) => next(error));
});

app.get("/api/persons", (_, response, next) => {
  Person.find({})
    .then((people) => response.json(people))
    .catch((error) => next(error));
});

app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      response.json(person);
    })
    .catch((error) => next(error));
});

app.post("/api/persons", (request, response, next) => {
  const { name, number } = request.body;

  const person = new Person({ name, number });
  person
    .save()
    .then((data) => response.json(data))
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (req, res, next) => {
  const body = req.body;
  Person.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((person) => res.json(person))
    .catch((err) => next(err));
});

app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => response.status(204).end())
    .catch((error) => next(error));
});

const unknownEndpoint = (_, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  }
  if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
