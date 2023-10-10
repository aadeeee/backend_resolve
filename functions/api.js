import express ,{Router}from "express";
import serverless from "serverless-http";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "./jwt/authjwt";
const app = express();
app.use(express.json());
const router = Router(); 
const mongoString = process.env.DATABASE_URL;

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
});


const ProdukSchema = new mongoose.Schema({
  namaProduk: String,
  img: String,
  hargaJual: Number,
  hargaBeli: Number,
  kategori: String,
  deskripsi: {
    type: String,
    default: "",
  },
  stock: Number,
});

const Produk = mongoose.model("Produk", ProdukSchema);

const TransaksiSchema = new mongoose.Schema({
  nomorAntrian: Number,
  inProcess: Boolean,
  metodePembayaran: String,
  date: String,
  time: String,
  listProduk: Map,
  listProdukAkhir: Array,
});

const Transaksi = mongoose.model("Transaksi", TransaksiSchema);


const UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  gender: String,
  email: String,
  noHp: Number,
  password: String,
  profilePictures: String,
  jadwal: String,
  isOwner: Boolean,
  isActive: Boolean,
});

const User = mongoose.model("User", UserSchema);

export const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

const checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      res.status(400).send({ message: "Failed! Username is already in use!" });
      return;
    }

    // Email
    User.findOne({
      email: req.body.email,
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        res.status(400).send({ message: "Failed! Email is already in use!" });
        return;
      }

      next();
    });
  });
};

database.once("connected", () => {
  console.log("Database Connected");
});

app.use(cors());
app.use("/", router);

router.get("/transaksi", async (req, res) => {
  try {
    const data = await Transaksi.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

router.get("/produk", async (req, res) => {
  try {
    const data = await Produk.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
router.get("/transaksi/:id", async (req, res) => {
  try {
    id = req.params.id;
    const data = await Transaksi.findById(id);
    res.status(200).json(data);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
router.get("/product/:id", async (req, res) => {
  try {
    id = req.params.id;
    const data = await Barang.find();
    const data2 = await data.filter((val) => val.idToko == id);
    res.status(200).json(data2);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
router.get("/detailProduct/:id", async (req, res) => {
  try {
    id = req.params.id;
    const data = await Barang.findById(id);
    res.status(200).json(data);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

router.post("/register", [checkDuplicateUsernameOrEmail], (req, res) => {
  const user = new User({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    gender: req.body.gender,
    noHp: req.body.noHp,
    password: bcrypt.hashSync(req.body.password, 8),
    profilePictures: req.body.profilePictures,
    jadwal: req.body.jadwal,
    isOwnwer: req.body.isOwnwer,
    isActive: req.body.isActive,
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    } else {
      res.send({ message: "User was registered successfully!" });
    }
  });
});

router.post("/login", (req, res) => {
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }
    var token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        gender: user.gender,
        noHp: user.noHp,
      },
      secret,
      {
        expiresIn: 86400, 
      }
    );

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      gender: user.gender,
      noHp: user.noHp,
      accessToken: token,
    });
  });
});


export const handler = serverless(app);
