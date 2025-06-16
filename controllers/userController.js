const userService = require("../services/userService");

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const UID = await userService.addUser(req.body);
    if (!UID) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }
    res.status(201).json({ message: "Registro exitoso", UID });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userService.verifyUser(email, password);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    res.status(200).json({ message: "Inicio de sesión exitoso", user });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
