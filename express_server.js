const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
// const morgan = require('morgan');
//const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const getUserByEmail = require("./helpers");

app.set("view engine", "ejs");
app.use(express.urlencoded());
// app.use(express.json()); // Required to parse JSON request bodies
// app.use(morgan("dev")); // Required to parse cookies
// app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["Hans", "Wang"],
  maxAge: 24 * 60 * 60 * 1000  // 24 hours
})); // Required to parse cookies
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "userRandomID"}
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
// for (const userID in users) {
//   console.log(`User ID: ${userID}`);
//   console.log(users[userID]);
// };

function generateRandomString() {
	let shortURLID = '';
  let arr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 6; i++) {
		shortURLID += arr[(Math.floor(Math.random() * arr.length))];
	}
	return shortURLID;
};



function urlsForUser(id) {
  const userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};


app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    const message = `Please login to continue <a href="/login">LOGIN HERE</a>`;
    res.send(401, message);
    return;
  };
  let userUrls = urlsForUser(req.session.user_id)

  const templateVars = {
    urls: userUrls,
    user: users[req.session.user_id]
  }
    
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {user: users[req.session.user_id]}
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    const message = "Please log in first.";
    res.send(401, message);
  };

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    const message = "You can't edit Urls that don't belong to you"
    res.send(401, message);  
    }
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, 
      user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  // If the user is not logged in, POST /urls should respond 
  // with an HTML message that tells the user why they cannot shorten URLs.
  if (!req.session.user_id) {
    const message = "You must log in to shorten URLs"
    res.send(401, message);
    return;
  }

  const id = generateRandomString();
  urlDatabase[id] = {longURL: req.body.longURL, userID: req.session.user_id};
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
  const objectId = req.params.id;

  urlDatabase[objectId] = objectLongURL;
  res.redirect("/urls");
});

//New login route
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = {user: users[req.session.user_id]};
    res.render('urls_login', templateVars);
  }
});

//Login route
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!getUserByEmail(email, users)) {
    res.send(400, "Email and/or password is incorrect");
  } else {
    const users = getUserByEmail(email, users);
    
    if (!bcrypt.compareSync(password, users.password)) {
      res.send(400, "Email and/or password is incorrect");
    } else {
      const id = users.id;
      req.session.user_id = id;
      res.redirect('/urls');
    }
  }
});

//Logout route
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//Register route
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = {user: users[req.session.user_id]}
    res.render('urls_register', templateVars);
  }
});

//Registration handling
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === '' || password === '') {
    res.send(403, "Please include a valid email/ password.");
  } else if (getUserByEmail(email, users)) {
    res.send(403, "Email has been used, existing user");
  } else {
    const id = generateRandomString();
    users[id] = {id: id, email: email, password: hashedPassword};
    req.session.user_id = id;
    res.redirect('/urls');
  }
})

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});