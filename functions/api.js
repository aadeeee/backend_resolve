import express ,{Router}from "express";
import serverless from "serverless-http";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
const secret = "asdf234234124dfasdf";
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
  qty: Number,
  price: Number,
  namaProduk: String,
});

const Transaksi = mongoose.model("Transaksi", TransaksiSchema);


const UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  gender: String,
  email: String,
  noHp: Number,
  password: String,
});

const User = mongoose.model("User", UserSchema);

 const verifyToken = (req, res, next) => {
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

router.post("/transaksi", async (req, res) => {
  try {
    const {
      nomorAntrian,
      inProcess,
      metodePembayaran,
      date,
      time,
      qty,
      price,
      namaProduk
    } = req.body;

    // Buat objek transaksi baru
    const newTransaksi = new Transaksi({
      nomorAntrian,
      inProcess,
      metodePembayaran,
      date,
      time,
      qty,
      price,
      namaProduk
    });

    // Simpan transaksi ke database
    await newTransaksi.save();

    res.status(201).json({ message: 'Transaksi berhasil ditambahkan', data: newTransaksi });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan transaksi', error: error.message });
  }
});

router.put("/transaksi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { inProcess } = req.body;

    const transaksi = await Transaksi.findById(id);

    if (!transaksi) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    transaksi.inProcess = inProcess;
    await transaksi.save();

    res.status(200).json({ message: 'Nilai inProcess berhasil diubah', data: transaksi });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui nilai inProcess transaksi', error: error.message });
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

router.post('/produk', async (req, res) => {
  try {
    const { namaProduk, img, hargaJual, hargaBeli, kategori, deskripsi, stock } = req.body;

    // Buat objek produk baru
    const newProduk = new Produk({
      namaProduk,
      img,
      hargaJual,
      hargaBeli,
      kategori,
      deskripsi,
      stock
    });

    // Simpan produk ke database
    await newProduk.save();

    res.status(201).json({ message: 'Produk berhasil ditambahkan', data: newProduk });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan produk', error: error.message });
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


// router.post("/register", [checkDuplicateUsernameOrEmail], (req, res) => {
//   const user = new User({
//     name: req.body.name,
//     username: req.body.username,
//     email: req.body.email,
//     gender: req.body.gender,
//     noHp: req.body.noHp,
//     password: req.body.password,
//   });

//   user.save((err, user) => {
//     if (err) {
//       res.status(500).send({ message: err });
//       return;
//     } else {
//       res.send({ message: "User was registered successfully!" });
//     }
//   });
// });

router.post('/register', async (req, res) => {
  try {
    const { name, username, email, gender, noHp, password } = req.body;

    // Buat objek produk baru
    const newUser = new User({
      name, username, email, gender, noHp, password
    });

    // Simpan produk ke database
    await newUser.save();

    res.status(201).json({ message: 'User berhasil ditambahkan', data: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan user', error: error.message });
  }
});

router.put('/produk/:id', async (req, res) => {
  try {
    const productId = req.params.id; 
    const { namaProduk, img, hargaJual, hargaBeli, kategori, deskripsi, stock } = req.body;

    const produk = await Produk.findById(productId);

    if (!produk) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Memperbarui properti produk
    produk.namaProduk = namaProduk;
    produk.img = img;
    produk.hargaJual = hargaJual;
    produk.hargaBeli = hargaBeli;
    produk.kategori = kategori;
    produk.deskripsi = deskripsi;
    produk.stock = stock;

    await produk.save();

    res.status(200).json({ message: 'Produk berhasil diperbarui', data: produk });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui produk', error: error.message });
  }
});


router.delete('/produk/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const produk = await Produk.findById(productId);

    if (!produk) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Delete the product
    await produk.remove();

    res.status(200).json({ message: 'Produk berhasil dihapus', data: produk });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus produk', error: error.message });
  }
});

router.delete("/transaksi/:id", async (req, res) => {
  try {
    const transaksiId = req.params.id;

    // Cari transaksi berdasarkan ID dan hapus
    const deletedTransaksi = await Transaksi.findByIdAndDelete(transaksiId);

    if (!deletedTransaksi) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    res.status(200).json({ message: 'Transaksi berhasil dihapus', data: deletedTransaksi });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus transaksi', error: error.message });
  }
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

    // var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

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
      },
      secret,
      {
        expiresIn: 86400, 
      }
    );

    res.status(200).send({
      id: user._id,
      username: user.username,
      accessToken: token,
    });
  });
});


export const handler = serverless(app);
