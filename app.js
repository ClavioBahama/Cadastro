require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const app = express();

// Configurar o Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Servir arquivos estáticos (como o index.html)

// Configurar banco de dados MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Clayne258',
  database: process.env.DB_DATABASE || 'login_db'
});

// Conectar ao banco
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL!');
});

// Configurar e-mail (use uma senha de aplicativo do Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'claviochitsulete@gmail.com',
    pass: process.env.EMAIL_PASS || 'yfaakmkamspspnzw' // Senha de aplicativo do Gmail
  }
});


// Servir o formulário HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Rota de registro
app.post('/register', async (req, res) => {
  const { name, age, email, password, confirmPassword } = req.body;

  // Verificar se as senhas batem
  if (password !== confirmPassword) {
    return res.send('As senhas não batem, cara!');
  }

  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário no banco
    db.query(
      'INSERT INTO users (name, age, email, password) VALUES (?, ?, ?, ?)',
      [name, age, email, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.send('Esse e-mail já tá cadastrado!');
          }
          console.error('Erro no registro:', err);
          return res.send('Deu ruim no registro, tenta de novo!');
        }
        res.send('Usuário cadastrado com sucesso! Pode logar agora.');
      }
    );
  } catch (error) {
    console.error('Erro no hash:', error);
    res.send('Deu ruim no registro, tenta de novo!');
  }
});

// Rota de login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Buscar usuário no banco
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Erro na busca:', err);
      return res.send('Deu ruim no login, tenta de novo!');
    }

    if (results.length === 0) {
      return res.send('E-mail não encontrado, cara!');
    }

    const user = results[0];

    // Verificar senha
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.send('Senha errada!');
    }

    // Registrar login no banco
    db.query(
      'INSERT INTO logins (user_id, login_time) VALUES (?, NOW())',
      [user.id],
      (err) => {
        if (err) {
          console.error('Erro ao registrar login:', err);
        }
      }
    );

    // Enviar e-mail de notificação
const mailOptions = {
      from: 'claviochitsulete@icloud.com',
      to: 'claviochitsulete@icloud.com',
      subject: 'Novo Login no Sistema',
      text: `O usuário ${user.name} (e-mail: ${user.email}) logou em ${new Date().toLocaleString()}`
    };


    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erro ao enviar e-mail:', error);
      } else {
        console.log('E-mail enviado:', info.response);
      }
    });

    res.send(`Bem-vindo, ${user.name}! Logado com sucesso!`);
  });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000!');
});

// Resto do teu código (rotas /register e /login) aqui...

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 3000}!`);
});