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
  host: 'localhost',
  user: 'root', // Troque pelo seu usuário do MySQL
  password: 'Clayne258', // Troque pela sua senha do MySQL
  database: 'login_db'
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
    user: 'claviochitsulete@gmail.com', // Seu e-mail
    pass: 'yfaakmkamspspnzw' // Senha de aplicativo do Gmail
  }
});

// Servir o formulário HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Rota de registro
app.post('/register', async (req, res) => {
  const { name, age, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send('As senhas não batem, cara!');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Tentando inserir usuário:', name, email); // Depuração
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
        console.log('Tentando enviar e-mail de cadastro para:', name, email); // Depuração
        const mailOptions = {
          from: 'claviochitsulete@gmail.com',
          to: 'claviochitsulete@gmail.com',
          subject: 'Novo Cadastro no Sistema',
          text: `Um novo usuário foi cadastrado: ${name} (e-mail: ${email}) às ${new Date().toLocaleString()}`
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Erro ao enviar e-mail de cadastro:', error);
          } else {
            console.log('E-mail de cadastro enviado:', info.response);
          }
        });
        res.send('Usuário cadastrado com sucesso! Pode logar agora.');
      }
    );
  } catch (error) {
    console.error('Erro no hash ou outro erro:', error);
    res.send('Deu ruim no registro, tenta de novo!');
  }
});

// Rota de login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Erro na busca:', err);
      return res.send('Deu ruim no login, tenta de novo!');
    }

    if (results.length === 0) {
      return res.send('E-mail não encontrado, cara!');
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.send('Senha errada!');
    }

    db.query(
      'INSERT INTO logins (user_id, login_time) VALUES (?, NOW())',
      [user.id],
      (err) => {
        if (err) {
          console.error('Erro ao registrar login:', err);
        }
      }
    );

    console.log('Tentando enviar e-mail de login para:', user.name, user.email); // Depuração
    const mailOptions = {
      from: 'claviochitsulete@gmail.com',
      to: 'claviochitsulete@gmail.com',
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
app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 3000}!`);
});