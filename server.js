require("dotenv").config();
const { json } = require("express");
const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./db");

const API_BASE = "/api";

// middleware
app.use(express.json());
app.use(cors());
// get all the restaurants
app.get(`${API_BASE}/restaurants`, async (req, res) => {
  try {
    const restaurantQuery = await db.query("SELECT * FROM restaurants");
    const ratingsQuery = await db.query(
      "SELECT restaurant_id, AVG(rating)::numeric(10,2) AS rating, COUNT(rating) AS reviews FROM reviews GROUP BY restaurant_id;"
    );
    const ratings = ratingsQuery.rows;
    res.status(200).json({
      status: "Success",
      count: restaurantQuery.rowCount,
      data: {
        restaurants: restaurantQuery.rows,
        ratings: ratings,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "Not Found",
    });
  }
});

// get a single restaurant based on id
app.get(`${API_BASE}/restaurants/:id`, async (req, res) => {
  try {
    const restaurant = await db.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [req.params.id]
    );

    const reviews = await db.query(
      "SELECT * FROM reviews WHERE restaurant_id = $1",
      [req.params.id]
    );
    res.status(200).json({
      status: "Success",
      data: {
        restaurant: restaurant.rows[0],
        reviews: reviews.rows,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "Not Found",
    });
  }
});

// create a restaurant
app.post(`${API_BASE}/restaurants`, async (req, res) => {
  try {
    const body = req.body;
    const result = await db.query(
      "INSERT INTO  restaurants (name, location, price_range) VALUES($1, $2, $3) returning *",
      [body.name, body.location, body.price_range]
    );
    res.status(200).json({
      status: "create - Success",
      count: result.rowCount,
      data: {
        restaurant: result.rows[0],
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "Not Found",
    });
  }
});

// Add a review
app.post(`${API_BASE}/restaurants/:id`, async (req, res) => {
  try {
    const body = req.body;
    const result = await db.query(
      "INSERT INTO  reviews (restaurant_id, name, rating, review) VALUES($1, $2, $3, $4) returning *",
      [body.restaurant_id, body.userName, body.rating, body.review]
    );

    res.status(200).json({
      status: "create - Success",
      review: result.rows[0],
    });
  } catch (error) {
    res.status(404).json({
      status: "Not Found",
    });
  }
});

// update a restaurant
app.put(`${API_BASE}/restaurants/:id`, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const result = await db.query(
      "UPDATE restaurants SET name = $1, location = $2, price_range = $3 WHERE id = $4returning *",
      [body.name, body.location, body.price_range, id]
    );
    res.status(200).json({
      status: "update - Success",
      count: result.rowCount,
      data: {
        restaurants: result.rows,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "Not Found",
    });
  }
});

// delete a restaurant
app.delete(`${API_BASE}/restaurants/:id`, async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM reviews WHERE restaurant_id = $1", [id]);
    const result = await db.query(
      "DELETE FROM restaurants WHERE id = $1 returning *",
      [id]
    );
    res.status(200).json({
      status: "Delete - Success",
      count: result.rowCount,
      data: {
        restaurants: result.rows,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "Not Found",
    });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Listening on Port: ${PORT}`));
