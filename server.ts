import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import multer from "multer";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = "1003-secret-key-very-secure";
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Database setup
const db = new Database("database.sqlite");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS bulletins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS mural (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    type TEXT DEFAULT 'text', -- 'text', 'photo', 'news'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON string
    scheduled_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER,
    user_id INTEGER,
    option_index INTEGER NOT NULL,
    FOREIGN KEY (poll_id) REFERENCES polls (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(poll_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS poll_dismissals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (poll_id) REFERENCES polls (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(poll_id, user_id)
  );
`);

// Migration: Add missing columns to mural table if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(mural)").all() as any[];
const columnNames = tableInfo.map(c => c.name);
if (!columnNames.includes("image_url")) {
  db.exec("ALTER TABLE mural ADD COLUMN image_url TEXT");
}
if (!columnNames.includes("type")) {
  db.exec("ALTER TABLE mural ADD COLUMN type TEXT DEFAULT 'text'");
}
if (!columnNames.includes("scheduled_date")) {
  db.exec("ALTER TABLE mural ADD COLUMN scheduled_date TEXT");
}

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const adminPassword = bcrypt.hashSync("admin123", 10);
  const userPassword = bcrypt.hashSync("user123", 10);
  
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Administrador", "admin@1003.com", adminPassword, "admin"
  );
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "João Silva", "joao@email.com", userPassword, "user"
  );
  
  db.prepare("INSERT INTO mural (title, content, type) VALUES (?, ?, ?)").run(
    "Bem-vindo ao 1003", "Este é o novo mural de atividades e boletins.", "text"
  );
}

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Middleware for auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } else {
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

app.get("/api/users", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const users = db.prepare("SELECT id, name, email, role FROM users WHERE role = 'user'").all();
  res.json(users);
});

app.post("/api/users", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      name, email, hashedPassword, "user"
    );
    res.json({ success: true });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Este e-mail já está em uso" });
    }
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

app.delete("/api/users/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { id } = req.params;
  
  try {
    // Delete related data first
    db.prepare("DELETE FROM bulletins WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM poll_votes WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM poll_dismissals WHERE user_id = ?").run(id);
    
    // Finally delete the user
    const result = db.prepare("DELETE FROM users WHERE id = ? AND role = 'user'").run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Usuário não encontrado ou é um administrador" });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir usuário e suas dependências" });
  }
});

app.get("/api/stats", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any;
  res.json({ userCount: userCount.count });
});

app.post("/api/upload-bulletin", authenticateToken, upload.single("file"), (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { userId } = req.body;
  const file = req.file;

  if (!file || !userId) return res.status(400).json({ error: "Arquivo ou usuário não fornecido" });

  db.prepare("INSERT INTO bulletins (user_id, filename, original_name, mime_type) VALUES (?, ?, ?, ?)").run(
    userId, file.filename, file.originalname, file.mimetype
  );

  res.json({ success: true });
});

app.get("/api/my-bulletins", authenticateToken, (req: any, res) => {
  const bulletins = db.prepare("SELECT * FROM bulletins WHERE user_id = ? ORDER BY received_at DESC").all(req.user.id);
  res.json(bulletins);
});

app.get("/api/users/:id/bulletins", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const bulletins = db.prepare("SELECT * FROM bulletins WHERE user_id = ? ORDER BY received_at DESC").all(req.params.id);
  res.json(bulletins);
});

app.delete("/api/bulletins/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { id } = req.params;
  
  try {
    const bulletin = db.prepare("SELECT filename FROM bulletins WHERE id = ?").get(id) as any;
    if (bulletin) {
      const filePath = path.join(uploadsDir, bulletin.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    db.prepare("DELETE FROM bulletins WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir boletim" });
  }
});

app.get("/api/mural", authenticateToken, (req, res) => {
  const now = new Date().toISOString();
  // Only return posts that haven't expired (if scheduled_date is set)
  const posts = db.prepare(`
    SELECT * FROM mural 
    WHERE scheduled_date IS NULL OR scheduled_date >= ?
    ORDER BY created_at DESC
  `).all(now);
  res.json(posts);
});

app.post("/api/mural", authenticateToken, upload.single("image"), (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { title, content, type, scheduled_date } = req.body;
  const file = req.file;

  let imageUrl = null;
  if (file) {
    imageUrl = `/uploads/${file.filename}`;
  }

  db.prepare("INSERT INTO mural (title, content, image_url, type, scheduled_date) VALUES (?, ?, ?, ?, ?)").run(
    title, content || "", imageUrl, type || "text", scheduled_date || null
  );

  res.json({ success: true });
});

app.delete("/api/mural/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { id } = req.params;
  db.prepare("DELETE FROM mural WHERE id = ?").run(id);
  res.json({ success: true });
});

// Polls API
app.get("/api/polls", authenticateToken, (req: any, res) => {
  const now = new Date().toISOString();
  const polls = db.prepare(`
    SELECT * FROM polls 
    WHERE scheduled_date IS NULL OR scheduled_date >= ?
    ORDER BY created_at DESC
  `).all(now);
  
  // Add vote counts and user vote status
  const pollsWithData = polls.map((poll: any) => {
    const options = JSON.parse(poll.options);
    const votes = db.prepare("SELECT option_index FROM poll_votes WHERE poll_id = ?").all(poll.id);
    const userVote = db.prepare("SELECT option_index FROM poll_votes WHERE poll_id = ? AND user_id = ?").get(poll.id, req.user.id);
    const dismissed = db.prepare("SELECT 1 FROM poll_dismissals WHERE poll_id = ? AND user_id = ?").get(poll.id, req.user.id);
    
    return {
      ...poll,
      options,
      voteCounts: options.map((_: any, i: number) => votes.filter((v: any) => v.option_index === i).length),
      userVote: userVote ? (userVote as any).option_index : null,
      dismissed: !!dismissed
    };
  });
  res.json(pollsWithData);
});

app.post("/api/polls", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { question, options, scheduled_date } = req.body;
  db.prepare("INSERT INTO polls (question, options, scheduled_date) VALUES (?, ?, ?)").run(
    question, JSON.stringify(options), scheduled_date || null
  );
  res.json({ success: true });
});

app.post("/api/polls/:id/vote", authenticateToken, (req: any, res) => {
  const { option_index } = req.body;
  try {
    db.prepare("INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)").run(
      req.params.id, req.user.id, option_index
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Já votou ou enquete inválida" });
  }
});

app.post("/api/polls/:id/dismiss", authenticateToken, (req: any, res) => {
  try {
    db.prepare("INSERT INTO poll_dismissals (poll_id, user_id) VALUES (?, ?)").run(
      req.params.id, req.user.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Erro ao dispensar enquete" });
  }
});

app.delete("/api/polls/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const { id } = req.params;
  db.prepare("DELETE FROM polls WHERE id = ?").run(id);
  db.prepare("DELETE FROM poll_votes WHERE poll_id = ?").run(id);
  db.prepare("DELETE FROM poll_dismissals WHERE poll_id = ?").run(id);
  res.json({ success: true });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
