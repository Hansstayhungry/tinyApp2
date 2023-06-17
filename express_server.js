const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
// const morgan = require('morgan');
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(express.urlencoded());
// app.use(express.json()); // Required to parse JSON request bodies
// app.use(morgan("dev")); // Required to parse cookies
app.use(cookieParser()); // Required to parse cookies
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", id: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com", id: "userRandomID"}
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Helper to check all users info
for (const userId in users) {
  console.log(`User ID: ${userId}`);
  console.log(users[userId]);
};

function generateRandomString() {
	let shortURLID = '';
  let arr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 6; i++) {
		shortURLID += arr[(Math.floor(Math.random() * arr.length))];
	}
	return shortURLID;
};

function getUserByEmail(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
    return false;
};

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  }
    
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    const templateVars = {user: users[req.cookies["user_id"]]}
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  // If the user is not logged in, POST /urls should respond 
  // with an HTML message that tells the user why they cannot shorten URLs.
  if (!res.cookies) {
    const message = "You must log in to shorten URLs"
    res.send(401, message);
    return;
  }

  const id = generateRandomString();
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
    //error message if the id does not exist at GET /u/:id.
  } else {
    res.send(404, "No longURL associated with this short URL");
  }
});

// find the index of the urlDatabase, if exist, delete
app.post("/urls/:id/delete", (req, res) => {
  const objectId = req.params.id;
  // Delete if match
  if (urlDatabase.hasOwnProperty(objectId)) {
    delete urlDatabase[objectId];
    res.redirect("/urls");
  }
});

app.post("/urls/:id/", (req, res) => {
  const objectLongURL = req.body.long_url;
  console.log(objectLongURL);
  const objectId = req.params.id;

  urlDatabase[objectId] = objectLongURL;
  res.redirect("/urls");
});

//New login route
app.get('/login', (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect('/urls');
  } else {
    const templateVars = {user: users[req.cookies["user_id"]]};
    res.render('urls_login', templateVars);
  }
});

//Login route
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!getUserByEmail(email)) {
    res.send(400, "Email and/or password is incorrect");
  } else {
    const users = getUserByEmail(email);
    
    if (users.password !== password) {
      console.log(users.password);
      res.send(400, "Email and/or password is incorrect");
    } else {
      const id = users.id;
      res.cookie('user_id', id);
      res.redirect('/urls');
    }
  }
});

//Logout route
app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
});

//Register route
app.get('/register', (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect('/urls');
  } else {
    const templateVars = {user: users[req.cookies["user_id"]]}
    res.render('urls_register', templateVars);
  }
});

//Registration handling
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email === '' || password === '') {
    res.send(403, "Please include a valid email/ password.");
  } else if (getUserByEmail(email)) {
    res.send(403, "Email has been used, existing user");
  } else {
    const id = generateRandomString();
    users[id] = {id: id, email: email, password: password};
    res.cookie('user_id', id);
    console.log(users);
    res.redirect('/urls');
  }
})

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});